const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['tiktok', 'tt', 'tiktokdl', 'ttdl'],
    requiredLevel: 0,
    
    run: async ({ sock, m, prefix, args }) => {
        // 1. AMBIL URL DARI PESAN ATAU QUOTE
        let url = args[0];
        if (!url && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            url = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
        }

        // VALIDASI AWAL
        if (!url || !url.includes('tiktok.com')) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *ERROR*\n\nKirim atau reply link TikTok!\n\nContoh: *${prefix}tiktok https://vt.tiktok.com/xxxxx*` 
            }, { quoted: m });
        }

        // 2. BERSIHKAN URL (HAPUS PARAMETER TRACKING)
        const cleanUrl = url.split('?')[0].split('#')[0];
        console.log(`[TT_V2] Clean URL: ${cleanUrl}`);

        // 3. KIRIM STATUS PROSES
        await sock.sendMessage(m.key.remoteJid, { 
            text: '⏳ *Sedang memproses video...*' 
        }, { quoted: m });

        // 4. DOWNLOAD VIA CLI (PAKE PYTHON3 & PATH ABSOLUT)
        const filename = `tiktok_${Date.now()}.mp4`;
        const filepath = `/sdcard/Download/${filename}`;
        
        // Command pakai python3 biar gak error "command not found"
        const command = `python3 -m tiktok_downloader --tikwm --url "${cleanUrl}" --save "${filepath}" 2>&1`;

        console.log(`[TT_V2] Executing: ${command}`);

        exec(command, { timeout: 60000 }, async (error, stdout, stderr) => {
            try {
                const output = (stdout + stderr).toLowerCase();
                console.log(`[TT_V2] Output: ${output.substring(0, 200)}`);

                // CEK KEBERHASILAN BERDASARKAN UKURAN FILE (>50KB)
                if (fs.existsSync(filepath) && fs.statSync(filepath).size > 50000) {
                    await sock.sendMessage(m.key.remoteJid, { 
                        video: fs.readFileSync(filepath),
                        caption: `✅ *TIKTOK DOWNLOADER V2*\n\n_Download by ${prefix}tiktok_\n_Engine: TikWM CLI_`
                    }, { quoted: m });
                    
                    fs.unlinkSync(filepath);
                    console.log('[TT_V2] ✅ Success & deleted');
                } else {
                    // KIRIM ERROR MESSAGE JELAS KE USER
                    const errorMsg = output.includes('not found') ? 'Video tidak ditemukan/private' : 
                                     output.includes('failed') ? 'Gagal parsing URL' : 
                                     'Download gagal (cek log Termux)';
                    
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: `❌ *GAGAL DOWNLOAD*\n\n${errorMsg}\n\nOutput: ${output.substring(0, 100)}` 
                    }, { quoted: m });
                    
                    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                }
            } catch (e) {
                console.error('[TT_V2] Callback Error:', e);
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *CRASH SAAT KIRIM VIDEO*\n\n${e.message}` 
                }, { quoted: m }).catch(() => {});
            }
        });
    }
};

