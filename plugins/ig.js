const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['ig', 'instagram', 'igreel', 'igdl'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix, args }) => {
        try {
            let url = args.join(' ');
            
            // Cek jika URL ada di quoted message
            if (!url && m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
                url = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
            }
            
            // Validasi URL Instagram
            if (!url || (!url.includes('instagram.com') && !url.includes('instagr.am'))) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ URL Instagram tidak valid!\n\nContoh:\n${prefix}ig https://www.instagram.com/reel/xxxxx/\n${prefix}ig https://www.instagram.com/p/xxxxx/` 
                }, { quoted: m });
            }
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: '⏳ Sedang download video Instagram via yt-dlp...' 
            }, { quoted: m });
            
            // Buat folder temp
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const fileName = `ig_${Date.now()}.mp4`;
            const filePath = path.join(tempDir, fileName);
            
            // Command yt-dlp untuk Instagram
            // -f best: ambil kualitas terbaik
            // --no-playlist: hanya ambil 1 video (bukan semua post)
            const cmd = `yt-dlp -f "best[ext=mp4]/best" --no-playlist -o "${filePath}" "${url}" 2>&1`;
            
            exec(cmd, { timeout: 120000 }, async (error, stdout, stderr) => {
                // Cek apakah file berhasil didownload
                if (!fs.existsSync(filePath)) {
                    console.error('[IG] yt-dlp error:', stderr);
                    return await sock.sendMessage(m.key.remoteJid, { 
                        text: '❌ Gagal download video Instagram.\n\nKemungkinan:\n• Video private/terkunci\n• URL tidak valid\n• Instagram memblokir request\n\nCoba link lain atau cek log.' 
                    }, { quoted: m });
                }
                
                const stats = fs.statSync(filePath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                // Batasi ukuran file (50MB untuk WhatsApp)
                if (stats.size > 50 * 1024 * 1024) {
                    fs.unlinkSync(filePath);
                    return await sock.sendMessage(m.key.remoteJid, { 
                        text: `❌ Video terlalu besar (${fileSizeMB}MB). Maksimal 50MB untuk WhatsApp.` 
                    }, { quoted: m });
                }
                
                // Kirim video
                await sock.sendMessage(m.key.remoteJid, {
                    video: fs.readFileSync(filePath),
                    caption: ` Instagram Video\n📦 Size: ${fileSizeMB}MB\n\n_Download via yt-dlp_`,
                    mimetype: 'video/mp4'
                }, { quoted: m });
                
                // Hapus file temp
                fs.unlinkSync(filePath);
                console.log(`[IG] ✓ Berhasil download: ${fileSizeMB}MB`);
            });
            
        } catch (err) {
            console.error('[IG ERROR]', err);
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Error: ${err.message}` 
            }, { quoted: m });
        }
    }
};
