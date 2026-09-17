const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['ytmp4', 'ytv', 'playvid'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix, args }) => {
        console.log('[YTMP4 DEBUG] Command diterima!', { args, quoted: !!m.quoted });
        
        let url = args.join(' ');
        if (!url && m.quoted && m.quoted.text) {
            const match = m.quoted.text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
            url = match ? match[0] : m.quoted.text;
        }

        console.log('[YTMP4 DEBUG] URL yang diekstrak:', url);

        if (!url || !ytdl.validateURL(url)) {
            console.log('[YTMP4 DEBUG] URL tidak valid atau kosong');
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Link YouTube tidak ditemukan!\n\nCara pakai:\n1. Ketik: *${prefix}ytmp4 https://youtu.be/xxx*\n2. Atau reply pesan yang ada link YouTube-nya dengan: *${prefix}ytmp4*` 
            }, { quoted: m });
        }

        try {
            console.log('[YTMP4 DEBUG] Mulai download...');
            await sock.sendMessage(m.key.remoteJid, { text: '⏳ Sedang download video secara lokal, mohon tunggu...' }, { quoted: m });

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;
            const format = ytdl.chooseFormat(info.formats, { quality: '18', filter: 'audioandvideo' });

            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                console.log('[YTMP4 DEBUG] Membuat folder temp:', tempDir);
                fs.mkdirSync(tempDir);
            }
            
            const fileName = `ytmp4_${Date.now()}.mp4`;
            const filePath = path.join(tempDir, fileName);
            console.log('[YTMP4 DEBUG] Path file:', filePath);

            await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                ytdl(url, { format: format })
                    .pipe(writeStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            console.log('[YTMP4 DEBUG] Download selesai, mengirim ke WA...');
            await sock.sendMessage(m.key.remoteJid, {
                video: fs.readFileSync(filePath),
                caption: ` *${title}*\n\n_Download lokal tanpa API_`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            fs.unlinkSync(filePath);
            console.log('[YTMP4 DEBUG] Selesai!');

        } catch (err) {
            console.error('[YTMP4 ERROR]', err.message, err.stack);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal download video. Coba link lain atau cek koneksi.' }, { quoted: m });
        }
    }
};
