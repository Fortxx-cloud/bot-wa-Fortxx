const { createCanvas, loadImage } = require('canvas');

module.exports = {
    alias: ['qc', 'quote', 'q'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix, args, text }) => {
        try {
            const inputText = text || args.join(' ') || (m.quoted && m.quoted.text);
            if (!inputText) return m.reply(`Ketik: *${prefix}qc teksnya* atau reply pesan.`);

            const width = 600;
            const height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // 1. Background WA Dark Mode
            ctx.fillStyle = '#0b141a';
            ctx.fillRect(0, 0, width, height);

            // 2. Ambil Foto Profil Asli
            let avatarUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; // Default kalau tidak ada PP
            try {
                const pp = await sock.profilePictureUrl(m.sender, 'image');
                if (pp) avatarUrl = pp;
            } catch (e) {
                // Gagal ambil PP, pakai default
            }

            const avatar = await loadImage(avatarUrl);

            // 3. Gambar Avatar Lingkaran (Clipping)
            const avatarX = 60;
            const avatarY = 80;
            const avatarSize = 60; // Diameter

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip(); // Potong gambar jadi lingkaran
            ctx.drawImage(avatar, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
            ctx.restore();

            // 4. Nama Pengirim
            const name = m.pushName || 'User';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#00a884'; // Hijau WA
            ctx.font = 'bold 16px Arial';
            ctx.fillText(name, 105, 75);

            // 5. Bubble Chat
            const bubbleX = 105;
            const bubbleY = 95;
            const bubbleW = 450;
            const bubbleH = 180;
            const r = 12;

            ctx.fillStyle = '#202c33';
            ctx.beginPath();
            ctx.moveTo(bubbleX + r, bubbleY);
            ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
            ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r);
            ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
            ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH);
            ctx.lineTo(bubbleX + 20, bubbleY + bubbleH);
            ctx.lineTo(bubbleX, bubbleY + bubbleH + 15);
            ctx.lineTo(bubbleX + 15, bubbleY + bubbleH);
            ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
            ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r);
            ctx.lineTo(bubbleX, bubbleY + r);
            ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + r, bubbleY);
            ctx.closePath();
            ctx.fill();

            // 6. Teks (Word Wrap)
            ctx.fillStyle = '#e9edef';
            ctx.font = '18px Arial';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            
            const words = inputText.split(' ');
            let line = '';
            let y = bubbleY + 20;
            const maxWidth = bubbleW - 80;
            const lineHeight = 26;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, bubbleX + 20, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, bubbleX + 20, y);

            // 7. Jam & Centang Biru
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + '.' + now.getMinutes().toString().padStart(2, '0');
            ctx.fillStyle = '#8696a0';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(timeStr + ' ✓✓', bubbleX + bubbleW - 15, bubbleY + bubbleH - 25);

            // 8. Kirim Gambar
            const buffer = canvas.toBuffer('image/png');
            await sock.sendMessage(m.key.remoteJid, { image: buffer, caption: '' }, { quoted: m });

        } catch (err) {
            console.error('[QC ERROR]', err);
            m.reply(`Gagal generate QC: ${err.message}`);
        }
    }
};
