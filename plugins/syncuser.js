const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'syncuser',
    alias: ['syncuser', 'syncid', 'sync'],
    desc: 'Menyinkronkan semua ID/LID dari database ke Whitelist handler.js',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m }) => {
        const chatId = m.key.remoteJid;
        const handlerPath = path.join(__dirname, '../handler.js');
        const dbPath = path.join(__dirname, '../database', 'users.json');

        let msg = ` *Menyinkronkan Database ke Whitelist...*\n\n`;
        let changes = 0;

        try {
            if (!fs.existsSync(dbPath)) {
                return await sock.sendMessage(chatId, { text: '❌ Database users.json tidak ditemukan.' }, { quoted: m });
            }

            const ids = JSON.parse(fs.readFileSync(dbPath));
            let content = fs.readFileSync(handlerPath, 'utf-8');

            ids.forEach(id => {
                const cleanId = id.replace(/[^0-9]/g, '').split(':')[0];
                if (cleanId && !content.includes(`'${cleanId}'`)) {
                    content = content.replace('const WHITELIST_IDS = [', `const WHITELIST_IDS = [\n    '${cleanId}',`);
                    changes++;
                }
            });

            if (changes > 0) {
                fs.writeFileSync(handlerPath, content);
                if (require.cache[require.resolve(handlerPath)]) delete require.cache[require.resolve(handlerPath)];
                msg += `✅ *Berhasil!* ${changes} ID/LID baru ditambahkan ke Whitelist.\n`;
                msg += `🔄 *Bot akan restart otomatis...*`;
                await sock.sendMessage(chatId, { text: msg }, { quoted: m });
                setTimeout(() => process.exit(0), 2000); // Auto restart via pm2 watch atau manual
            } else {
                msg += `️ *Semua ID sudah tersinkronisasi.*`;
                await sock.sendMessage(chatId, { text: msg }, { quoted: m });
            }
        } catch (e) {
            msg += `❌ *Error:* ${e.message}`;
            await sock.sendMessage(chatId, { text: msg }, { quoted: m });
        }
    }
};
