const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    alias: ['s', 'sticker', 'stiker'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix }) => {
        const msg = m.message || m;
        let quotedMessage = null;
        
        if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
            quotedMessage = msg.extendedTextMessage.contextInfo.quotedMessage;
        }

        const imageMsg = quotedMessage?.imageMessage;
        
        if (!quotedMessage || !imageMsg) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `❌ Reply gambar dengan command *${prefix}sticker*`
            }, { quoted: m });
        }

        await sock.sendMessage(m.key.remoteJid, {
            text: '⏳ Sedang convert...'
        }, { quoted: m });

        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const inputPath = path.join(tempDir, `img_${Date.now()}.png`);
            const outputPath = path.join(tempDir, `stk_${Date.now()}.webp`);

            const buffer = await downloadMediaMessage(
                { message: quotedMessage },
                'buffer',
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );
            
            fs.writeFileSync(inputPath, buffer);

            exec(`ffmpeg -y -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease" -vcodec libwebp -lossless 0 -compression_level 6 -preset picture -an -vsync 0 ${outputPath}`, async (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

                if (err || !fs.existsSync(outputPath)) {
                    return await sock.sendMessage(m.key.remoteJid, {
                        text: '❌ Gagal convert sticker'
                    }, { quoted: m });
                }

                await sock.sendMessage(m.key.remoteJid, {
                    sticker: fs.readFileSync(outputPath)
                }, { quoted: m });

                fs.unlinkSync(outputPath);
                console.log('[STICKER] Berhasil!');
            });

        } catch (e) {
            console.error('[STICKER Error:', e);
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ Error: ' + e.message
            }, { quoted: m });
        }
    }
};
