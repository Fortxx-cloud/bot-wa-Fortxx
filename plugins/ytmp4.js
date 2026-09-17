const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['ytmp4', 'ytv', 'playvid'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix, args }) => {
        try {
            let url = args.join(' ');
            
            // Cek quoted message jika tidak ada argumen
            if (!url && m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
                url = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
            }
            
            if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: `❌ URL YouTube tidak valid!\n\nContoh: *${prefix}ytmp4 https://youtu.be/xxx*`
                }, { quoted: m });
            }
            
            await sock.sendMessage(m.key.remoteJid, {
                text: '⏳ Sedang download video...'
            }, { quoted: m });
            
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const fileName = `ytmp4_${Date.now()}.mp4`;
            const filePath = path.join(tempDir, fileName);
            
            // Download pakai yt-dlp
            exec(`yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -o "${filePath}" "${url}"`, async (error, stdout, stderr) => {
                if (error || !fs.existsSync(filePath)) {
                    console.error('[YTMP4] yt-dlp error:', stderr);
                    return await sock.sendMessage(m.key.remoteJid, {
                        text: '❌ Gagal download video. Coba lagi nanti.'
                    }, { quoted: m });
                }
                
                const stats = fs.statSync(filePath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                // Cek ukuran file (max 50MB untuk WhatsApp)
                if (stats.size > 50 * 1024 * 1024) {
                    fs.unlinkSync(filePath);
                    return await sock.sendMessage(m.key.remoteJid, {
                        text: `❌ Video terlalu besar (${fileSizeMB}MB). Maksimal 50MB.`
                    }, { quoted: m });
                }
                
                // Ambil judul dari output yt-dlp
                const titleMatch = stderr.match(/$$download$$ Destination: (.+)/);
                const title = titleMatch ? titleMatch[1].replace('.mp4', '') : 'Video YouTube';
                
                await sock.sendMessage(m.key.remoteJid, {
                    video: fs.readFileSync(filePath),
                    caption: `*${title}*\n\n Size: ${fileSizeMB}MB\n_Download via yt-dlp_`,
                    mimetype: 'video/mp4'
                }, { quoted: m });
                
                fs.unlinkSync(filePath);
                console.log('[YTMP4] ✓ Selesai:', title);
            });
            
        } catch (err) {
            console.error('[YTMP4 ERROR]', err);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: m });
        }
    }
};
