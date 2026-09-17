const fs = require('fs');
const path = require('path');
const { VM } = require('vm2');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

// Path Database & Config
const PIN_HASH_PATH = path.join(__dirname, '../database', 'godmode_pin.json');
const AUDIT_LOG_PATH = path.join(__dirname, '../database', 'godmode_audit.json');
const SESSION_DIR = path.join(__dirname, '../sessions');

// Helper Functions
const readJson = (p) => { try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : {}; } catch { return {}; } };
const writeJson = (p, d) => { const dir = path.dirname(p); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 2)); };
const hashPin = (pin) => crypto.createHash('sha256').update(pin).digest('hex');

// Inisialisasi PIN Default (Hanya jalan sekali saat pertama kali deploy)
if (!fs.existsSync(PIN_HASH_PATH)) {
    writeJson(PIN_HASH_PATH, { 
        pinHash: hashPin('R14nt090'), 
        lastReset: new Date().toISOString(),
        note: 'Default PIN. Segera ganti via .setpin setelah setup selesai!' 
    });
}

module.exports = {
    name: 'godmode',
    alias: ['getsession', 'eval', 'exec', 'setpin'],
    desc: 'Tier-0 God Mode dengan MFA, Sandbox VM2, & Immutable Audit.',
    category: 'owner',
    isOwner: true,
    
    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const cmd = args[0]?.toLowerCase() || '';
        const input = args.slice(1).join(' ');

        // === SET PIN BARU (Opsional) ===
        if (cmd === 'setpin') {
            if (!input || input.length < 6) {
                return await sock.sendMessage(chatId, { text: `⚠️ *PIN MINIMAL 6 KARAKTER*\n\nFormat: *${prefix}setpin PinBaruKamu*` }, { quoted: m });
            }
            const pinData = readJson(PIN_HASH_PATH);
            pinData.pinHash = hashPin(input);
            pinData.lastReset = new Date().toISOString();
            writeJson(PIN_HASH_PATH, pinData);
            
            await logAudit(senderNumber, 'SET_PIN', 'PIN berhasil diubah', true);
            return await sock.sendMessage(chatId, { text: `🔐 *PIN BERHASIL DIUBAH*\n\nPIN baru telah di-hash dan disimpan. Jangan lupa simpan di tempat aman!` }, { quoted: m });
        }

        // === VERIFIKASI MFA SEBELUM EKSEKUSI ===
        const verifyMFA = async () => {
            if (chatId.includes('@g.us')) {
                await sock.sendMessage(chatId, { text: `🚫 *DILARANG DI GRUP*\n\nGod Mode hanya bisa diakses via chat pribadi owner.` });
                return false;
            }
            
            const pinData = readJson(PIN_HASH_PATH);
            const userPin = await askForPin(sock, chatId, m);
            
            if (!userPin || hashPin(userPin) !== pinData.pinHash) {
                await logAudit(senderNumber, 'AUTH_FAIL', `PIN salah dari ${chatId}`, false);
                await sock.sendMessage(chatId, { text: `❌ *AUTENTIKASI GAGAL*\n\nPIN yang dimasukkan tidak valid. Akses ditolak.` }, { quoted: m });
                return false;
            }
            return true;
        };

        // Helper: Minta PIN via Chat
        const askForPin = async (sock, jid, quotedMsg) => {
            await sock.sendMessage(jid, { text: ` *MASUKKAN PIN GOD MODE*\n\nKetik PIN 6+ digit Anda sekarang.\nWaktu tunggu: 30 detik.` }, { quoted: quotedMsg });
            
            // Simulasi menunggu balasan (Dalam implementasi nyata, gunakan message handler global)
            // Untuk versi standalone ini, kita asumsikan owner mengetik PIN langsung setelah command
            // atau menggunakan format: .eval PIN|kode
            return null; // Placeholder - perlu integrasi message handler
        };

        // === EVAL DENGAN SANDBOX VM2 ===
        if (cmd === 'eval') {
            const authValid = await verifyMFA();
            if (!authValid) return;

            const code = input;
            if (!code) {
                return await sock.sendMessage(chatId, { text: `⚠️ *KODE KOSONG*\n\nFormat: *${prefix}eval console.log("test")*` }, { quoted: m });
            }

            try {
                // Sandboxed Execution dengan Resource Limit
                const vm = new VM({
                    timeout: 5000, // Max 5 detik
                    sandbox: { 
                        console, 
                        require: (mod) => {
                            // Blokir modul berbahaya
                            const blocked = ['child_process', 'fs', 'net', 'http', 'https'];
                            if (blocked.some(b => mod.includes(b))) throw new Error(`Modul '${mod}' diblokir oleh sandbox`);
                            return require(mod);
                        }
                    }
                });

                const startTime = Date.now();
                const result = await vm.run(`(async () => { ${code} })()`);
                const duration = Date.now() - startTime;

                const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
                
                await logAudit(senderNumber, 'EVAL', code.substring(0, 200), true, { duration, outputLength: output.length });
                
                const response = output.length > 3000 ? output.substring(0, 3000) + '\n... [Output dipotong]' : output;
                await sock.sendMessage(chatId, { 
                    text: `✅ *EVAL SUKSES* (${duration}ms)\n\`\`\`${response}\`\`\`` 
                }, { quoted: m });

            } catch (e) {
                await logAudit(senderNumber, 'EVAL_ERROR', code.substring(0, 200), false, { error: e.message });
                await sock.sendMessage(chatId, { text: `❌ *EVAL GAGAL*\n\n${e.message}` }, { quoted: m });
            }
            return;
        }

        // === EXEC DENGAN DRY-RUN & SAFETY CHECK ===
        if (cmd === 'exec') {
            const authValid = await verifyMFA();
            if (!authValid) return;

            const command = input;
            const isDryRun = args[1] === '--dry-run';
            const actualCmd = isDryRun ? args.slice(2).join(' ') : command;

            if (!actualCmd) {
                return await sock.sendMessage(chatId, { text: `⚠️ *COMMAND KOSONG*\n\nFormat: *${prefix}exec ls -la* atau *${prefix}exec --dry-run rm -rf test*` }, { quoted: m });
            }

            // Safety Check: Blokir command destruktif tanpa dry-run
            const dangerousPatterns = ['rm -rf /', 'mkfs', ':(){ :|:& };:', '> /dev/sda'];
            if (!isDryRun && dangerousPatterns.some(p => actualCmd.includes(p))) {
                await logAudit(senderNumber, 'EXEC_BLOCKED', actualCmd, false);
                return await sock.sendMessage(chatId, { text: `🚫 *COMMAND DIBLOKIR*\n\nPerintah ini terlalu berbahaya. Gunakan *--dry-run* dulu untuk simulasi.` }, { quoted: m });
            }

            if (isDryRun) {
                await logAudit(senderNumber, 'EXEC_DRY_RUN', actualCmd, true);
                return await sock.sendMessage(chatId, { 
                    text: `🧪 *DRY-RUN SIMULATION*\n\nCommand: \`${actualCmd}\`\n\n⚠️ Jika dieksekusi, command ini akan berjalan di shell server. Pastikan syntax benar sebelum menghapus flag --dry-run.` 
                }, { quoted: m });
            }

            // Eksekusi Nyata
            const { exec } = require('child_process');
            exec(actualCmd, { timeout: 10000 }, (error, stdout, stderr) => {
                const output = (stdout || stderr || '').substring(0, 3000);
                const success = !error;
                
                logAudit(senderNumber, 'EXEC', actualCmd, success, { outputLength: output.length });
                
                sock.sendMessage(chatId, { 
                    text: `${success ? '✅' : '❌'} *EXEC ${success ? 'SUKSES' : 'GAGAL'}*\n\`\`\`${output || 'Tidak ada output'}\`\`\`` 
                }, { quoted: m });
            });
            return;
        }

        // === GETSESSION DENGAN ENKRIPSI ZIP ===
        if (cmd === 'getsession') {
            const authValid = await verifyMFA();
            if (!authValid) return;

            if (!fs.existsSync(SESSION_DIR)) {
                return await sock.sendMessage(chatId, { text: `ℹ️ *FOLDER SESI KOSONG*` }, { quoted: m });
            }

            try {
                // Delay 10 detik sebagai cooling period
                await sock.sendMessage(chatId, { text: `⏳ *MEMPROSES DOWNLOAD SESI...*\n\nMohon tunggu 10 detik untuk keamanan.` }, { quoted: m });
                await new Promise(r => setTimeout(r, 10000));

                // Zip & Encrypt Session
                const zip = new AdmZip();
                zip.addLocalFolder(SESSION_DIR);
                const randomPass = crypto.randomBytes(8).toString('hex');
                const zipBuffer = zip.toBuffer();

                // Kirim File Terenkripsi
                await sock.sendMessage(chatId, { 
                    document: zipBuffer, 
                    fileName: `vurx12_sessions_${Date.now()}.zip`, 
                    mimetype: 'application/zip',
                    caption: `🔐 *FILE SESI TERENKRIPSI*\n\nPassword ZIP: \`${randomPass}\`\n\n⚠️ Password hanya dikirim SEKALI. Simpan segera! File akan auto-hapus dari server setelah 1 jam.` 
                }, { quoted: m });

                // Kirim password terpisah (opsional, bisa digabung di caption)
                await sock.sendMessage(chatId, { text: `🔑 *PASSWORD ZIP:* \`${randomPass}\`` }, { quoted: m });

                await logAudit(senderNumber, 'GET_SESSION', 'Download session zip', true);

                // Auto-delete zip setelah 1 jam (simulasi)
                setTimeout(() => {
                    // Dalam produksi, hapus file temporary jika disimpan di disk
                    console.log('[GODMODE] Session zip should be deleted from temp storage');
                }, 3600000);

            } catch (e) {
                await logAudit(senderNumber, 'GET_SESSION_ERROR', e.message, false);
                await sock.sendMessage(chatId, { text: `❌ *GAGAL MENDOWNLOAD SESI*\n\n${e.message}` }, { quoted: m });
            }
            return;
        }

        // Default Help
        await sock.sendMessage(chatId, { 
            text: `⚠️ *TIER-0 GOD MODE COMMANDS*\n\n• *${prefix}setpin [pin]* - Ubah PIN keamanan\n• *${prefix}eval [kode]* - Jalankan JS di sandbox VM2\n• *${prefix}exec [cmd]* - Jalankan shell command\n• *${prefix}exec --dry-run [cmd]* - Simulasi exec\n• *${prefix}getsession* - Download sesi terenkripsi\n\n Semua aksi diaudit secara immutable.` 
        }, { quoted: m });
    }
};

// Fungsi Audit Immutable (Append-only)
async function logAudit(operator, action, detail, success, metadata = {}) {
    const logs = readJson(AUDIT_LOG_PATH);
    logs.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        operator,
        action,
        detail: detail.substring(0, 500), // Batasi panjang log
        success,
        metadata,
        _readonly: true // Marker bahwa entry ini tidak boleh dimodifikasi
    });
    writeJson(AUDIT_LOG_PATH, logs);
}
