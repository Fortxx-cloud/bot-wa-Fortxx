const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    alias: ['s', 'sticker', 'stiker'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix }) => {
        try {
            const msg = m.message || m;
            let quotedMessage = null;

            if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
                quotedMessage = msg.extendedTextMessage.contextInfo.quotedMessage;
            }

            // Cek apakah ada quoted message
            if (!quotedMessage) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: `️ *Sticker Maker*\n\nCara pakai:\n• Reply gambar/video dengan *${prefix}s*\n\nSupport: Gambar, Video, GIF`
                }, { quoted: m });
            }

            const imageMsg = quotedMessage?.imageMessage;
            const videoMsg = quotedMessage?.videoMessage;

            // Cek apakah gambar atau video
            if (!imageMsg && !videoMsg) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: '❌ Reply gambar atau video dulu bang!'
                }, { quoted: m });
            }

            const isVideo = !!videoMsg;
            const mediaType = isVideo ? 'video' : 'image';

            await sock.sendMessage(m.key.remoteJid, {
                text: `🎨 Sedang convert ${mediaType} ke sticker...`
            }, { quoted: m });

            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const inputPath = path.join(tempDir, `img_${Date.now()}.${isVideo ? 'mp4' : 'png'}`);
            const outputPath = path.join(tempDir, `stk_${Date.now()}.webp`);

            // Download media
            const buffer = await downloadMediaMessage(
                { message: quotedMessage },
                'buffer',
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );

            fs.writeFileSync(inputPath, buffer);
            console.log(`[Sticker] Processing ${mediaType} (${buffer.length} bytes)`);

            // FFmpeg command
            let ffmpegCmd = '';
            
            if (isVideo) {
                // Video/GIF ke Sticker Animasi
                ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,setsar=1" -lossless 0 -compression_level 6 -q:v 75 -loop 0 -preset default -an -vsync 0 -t 10 "${outputPath}" 2>&1`;
            } else {
                // Gambar ke Sticker Statis
                ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0,setsar=1" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 75 -preset picture -an -vsync 0 "${outputPath}" 2>&1`;
            }

            exec(ffmpegCmd, async (err) => {
                // Hapus file input
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

                if (err || !fs.existsSync(outputPath)) {
                    console.error('[Sticker] FFmpeg error:', err);
                    return await sock.sendMessage(m.key.remoteJid, {
                        text: '❌ Gagal convert sticker. Pastikan ffmpeg terinstall.'
                    }, { quoted: m });
                }

                const fileSize = fs.statSync(outputPath).size;
                console.log(`[Sticker] WebP generated: ${fileSize} bytes`);

                // Kirim sticker
                await sock.sendMessage(m.key.remoteJid, {
                    sticker: fs.readFileSync(outputPath)
                }, { quoted: m });

                // Cleanup
                fs.unlinkSync(outputPath);
                console.log('[Sticker] ✓ Berhasil!');
            });

        } catch (e) {
            console.error('[STICKER ERROR]', e);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ Error: ${e.message}`
            }, { quoted: m });
        }
    }
};
