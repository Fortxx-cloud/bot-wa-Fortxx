const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['toimg', 'toimage', 'stikertoimg'],
    requiredLevel: 0,
    
    run: async ({ sock, m, prefix }) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Validasi: Harus reply stiker & bukan animasi
        if (!quoted?.stickerMessage || quoted.stickerMessage.isAnimated) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *ERROR*\n\nReply stiker NON-ANIMASI dengan caption:\n*${prefix}toimg*` 
            }, { quoted: m });
        }

        await sock.sendPresenceUpdate('composing', m.key.remoteJid);
        await sock.sendMessage(m.key.remoteJid, { text: '⏳ *Sedang mengonversi stiker ke gambar...*' }, { quoted: m });

        try {
            // Download media stiker
            const media = await sock.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage);
            const inputPath = `/sdcard/Download/stk_${Date.now()}.webp`;
            const outputPath = `/sdcard/Download/img_${Date.now()}.png`;
            
            fs.writeFileSync(inputPath, media);

            // Konversi WebP ke PNG menggunakan ffmpeg (sudah pasti ada di Termux)
            exec(`ffmpeg -i ${inputPath} ${outputPath}`, async (err) => {
                fs.unlinkSync(inputPath); // Hapus file webp
                
                if (err || !fs.existsSync(outputPath)) {
                    return await sock.sendMessage(m.key.remoteJid, { 
                        text: '❌ Gagal mengonversi stiker. Pastikan ffmpeg sudah terinstall.' 
                    }, { quoted: m });
                }

                // Kirim hasil gambar
                await sock.sendMessage(m.key.remoteJid, { 
                    image: fs.readFileSync(outputPath),
                    caption: '✅ *Berhasil dikonversi ke gambar!*'
                }, { quoted: m });

                fs.unlinkSync(outputPath); // Bersihkan file setelah dikirim
            });

        } catch (e) {
            console.error('[TOIMG] Error:', e);
            await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ Terjadi kesalahan saat memproses stiker.' 
            }, { quoted: m });
        }
    }
};

