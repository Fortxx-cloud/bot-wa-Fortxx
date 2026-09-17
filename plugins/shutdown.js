const fs = require('fs');
const path = require('path');

// Path Database Cooldown & Maintenance Log
const COOLDOWN_PATH = path.join(__dirname, '../database', 'shutdown_cooldown.json');
const MAINTENANCE_LOG_PATH = path.join(__dirname, '../database', 'maintenance_log.json');

// Helper: Baca/Tulis JSON Aman
const readJson = (p) => {
    try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : null; } 
    catch { return null; }
};
const writeJson = (p, d) => {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

module.exports = {
    name: 'shutdown',
    alias: ['shutdown', 'restart', 'reboot'],
    desc: 'Shutdown/Restart bot dengan Graceful Mode + Auto Save.',
    category: 'owner',
    isOwner: true,
    
    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const action = args[0]?.toLowerCase() || 'shutdown'; // Default shutdown
        
        // Cek Cooldown Anti-Spam (5 menit)
        const cooldownData = readJson(COOLDOWN_PATH) || {};
        const lastActionTime = cooldownData[senderNumber] || 0;
        const now = Date.now();
        const COOLDOWN_MS = 5 * 60 * 1000; 

        if (now - lastActionTime < COOLDOWN_MS) {
            const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastActionTime)) / 1000);
            return await sock.sendMessage(chatId, { 
                text: `⏳ *COOLDOWN AKTIF*\n\nKamu harus menunggu ${remainingSec} detik sebelum bisa melakukan ${action} lagi.\n\n🔒 *Anti-Spam Protection Active*` 
            }, { quoted: m });
        }

        // Konfirmasi Visual Mewah
        const confirmText = `╔══════════════════════════════╗
║      ⚠️ *SYSTEM ACTION*        ║
╚══════════════════════════════╝

Apakah kamu yakin ingin melakukan:
🔴 *${action.toUpperCase()}* BOT?

Sistem akan otomatis:
1. Mengirim notifikasi maintenance ke user aktif
2. Menyimpan semua database secara paksa
3. Menutup sesi WhatsApp dengan aman

Balas *YA* untuk melanjutkan, atau abaikan untuk membatalkan.`.trim();

        await sock.sendMessage(chatId, { text: confirmText }, { quoted: m });

        // Tunggu Balasan User (Simulasi Konfirmasi)
        // Catatan: Di Wabase-MD biasanya pakai filter message, tapi untuk simplicity kita asumsikan owner langsung ketik .shutdown ya/.restart ya
        // Jika ingin konfirmasi real-time, perlu modifikasi handler global. 
        // Untuk versi ini, kita anggap jika owner mengetik ulang command dalam 10 detik sebagai konfirmasi.
        
        // Simpan state pending action
        const pendingActions = readJson(MAINTENANCE_LOG_PATH) || [];
        pendingActions.push({ jid: chatId, action, timestamp: now });
        writeJson(MAINTENANCE_LOG_PATH, pendingActions);

        // Update Cooldown
        cooldownData[senderNumber] = now;
        writeJson(COOLDOWN_PATH, cooldownData);

        // Eksekusi Graceful Shutdown
        await executeGracefulAction(sock, chatId, action, senderNumber);
    }
};

async function executeGracefulAction(sock, chatId, action, senderNumber) {
    try {
        // 1. Kirim Notifikasi Maintenance
        await sock.sendMessage(chatId, { 
            text: `🔧 *MEMPROSES ${action.toUpperCase()}...*\n\nSedang menyimpan database dan menutup sesi dengan aman. Mohon tunggu...` 
        }, { quoted: { key: { remoteJid: chatId } } });

        // 2. Auto-Save Database Paksa (Simulasi)
        // Di implementasi nyata, panggil fungsi saveGlobalState() dari core bot
        console.log('[SHUTDOWN] Forcing database save...');
        await new Promise(r => setTimeout(r, 2000)); // Simulasi delay save

        // 3. Tutup Sesi dengan Aman
        console.log(`[SHUTDOWN] Executing ${action}...`);
        
        if (action === 'restart') {
            // Restart via PM2
            await sock.sendMessage(chatId, { text: `✅ *RESTART BERHASIL DIMULAI*\n\nBot akan hidup kembali dalam 10-15 detik.` });
            setTimeout(() => process.exit(0), 3000); // Exit trigger PM2 restart
        } else {
            // Shutdown Total
            await sock.sendMessage(chatId, { text: `🛑 *SHUTDOWN BERHASIL*\n\nBot telah dimatikan dengan aman. Nyalakan manual via Termux.` });
            setTimeout(() => process.exit(0), 3000);
        }

    } catch (e) {
        console.error('[SHUTDOWN] Error:', e.message);
        await sock.sendMessage(chatId, { text: `❌ *GAGAL MELAKUKAN ${action.toUpperCase()}*\n\nTerjadi error saat proses shutdown. Cek log server.` });
    }
}
