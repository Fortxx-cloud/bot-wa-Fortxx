const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addblacklist',
    alias: ['addbl', 'blokir'],
    desc: 'Memasukkan User ID ke Blacklist database',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m, prefix, args }) => {
        const chatId = m.key.remoteJid;
        const targetId = args[0];

        if (!targetId || isNaN(targetId)) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Format Salah*\n\nGunakan: *${prefix}addbl 628123456789*` 
            }, { quoted: m });
        }

        const blPath = path.join(__dirname, '../database', 'blacklist.json');
        
        try {
            // Baca atau buat file jika belum ada
            let blacklist = [];
            if (fs.existsSync(blPath)) {
                blacklist = JSON.parse(fs.readFileSync(blPath));
            }

            if (blacklist.includes(targetId)) {
                return await sock.sendMessage(chatId, { 
                    text: `⚠️ *User ${targetId} sudah diblokir!*` 
                }, { quoted: m });
            }

            blacklist.push(targetId);
            fs.writeFileSync(blPath, JSON.stringify(blacklist, null, 2));

            return await sock.sendMessage(chatId, { 
                text: `🚫 *Blacklist Berhasil Diupdate!*\n\nUser ID \`${targetId}\` kini DIBLOKIR permanen.\nAkses command akan ditolak otomatis.` 
            }, { quoted: m });

        } catch (e) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Gagal update blacklist:* ${e.message}` 
            }, { quoted: m });
        }
    }
};
