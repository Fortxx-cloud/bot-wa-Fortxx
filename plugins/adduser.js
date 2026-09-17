const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'adduser',
    alias: ['adduser', 'addid', 'tambahid'],
    desc: 'Add ID from WA (@62...) to Whitelist & Database (Auto-detect LID)',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m, prefix, args }) => {
        const chatId = m.key.remoteJid;

        // 1. AMBIL ID DARI TAG ATAU TEKS MANUAL
        let rawInput = args[0];
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        let targetId = null;
        if (mentionedJid.length > 0) {
            targetId = mentionedJid[0].replace(/[^0-9]/g, '');
        } else if (rawInput) {
            targetId = rawInput.replace(/[^0-9]/g, '');
        }

        if (!targetId) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Format Salah*\n\nCara pakai:\n1. Tag user: *${prefix}adduser @628123...*\n2. Ketik manual: *${prefix}adduser @628123...*`
            }, { quoted: m });
        }

        // 2. PERSIAPAN FORMAT
        const fullId = `${targetId}@s.whatsapp.net`;
        const handlerPath = path.join(__dirname, '../handler.js');
        const dbPath = path.join(__dirname, '../database', 'users.json');
        const sessionsPath = path.join(__dirname, '../sessions');

        let msg = `🔄 *Memproses ID: @${targetId}...*\n\n`;
        let changes = 0;

        // 3. CARI LID DI FOLDER SESSIONS
        let foundLid = null;
        try {
            if (fs.existsSync(sessionsPath)) {
                const files = fs.readdirSync(sessionsPath);
                for (const file of files) {
                    if (file.includes('_reverse.json')) {
                        const filePath = path.join(sessionsPath, file);
                        const content = fs.readFileSync(filePath, 'utf-8');
                        if (content.includes(targetId)) {
                            const match = file.match(/lid-mapping-(\d+)_reverse\.json/);
                            if (match) {
                                foundLid = match[1];
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            msg += `⚠️ *LID Search Error:* ${e.message}\n`;
        }

        // 4. UPDATE HANDLER.JS (Tambahin Nomor HP + LID kalau ada)
        try {
            let content = fs.readFileSync(handlerPath, 'utf-8');
            const idsToAdd = [targetId];
            if (foundLid) idsToAdd.push(foundLid);

            for (const id of idsToAdd) {
                if (content.includes(`'${id}'`)) {
                    msg += `⏭️ *Whitelist:* ID \`${id}\` sudah ada.\n`;
                } else {
                    const wlIndex = content.indexOf('const WHITELIST_IDS');
                    if (wlIndex !== -1) {
                        const endIndex = content.indexOf('];', wlIndex);
                        if (endIndex !== -1) {
                            const before = content.substring(0, endIndex);
                            const after = content.substring(endIndex);
                            const updatedContent = before + `    '${id}',\n` + after;
                            fs.writeFileSync(handlerPath, updatedContent);
                            if (require.cache[require.resolve(handlerPath)]) delete require.cache[require.resolve(handlerPath)];
                            msg += `✅ *Whitelist:* ID \`${id}\` ditambahkan.\n`;
                            changes++;
                        }
                    }
                }
            }
        } catch (e) {
            msg += `❌ *Whitelist Error:* ${e.message}\n`;
        }

        // 5. UPDATE DATABASE (Simpan Full ID)
        try {
            let ids = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : [];
            if (!ids.includes(fullId)) {
                ids.push(fullId);
                fs.writeFileSync(dbPath, JSON.stringify(ids, null, 2));
                msg += `✅ *Database:* Full ID \`${fullId}\` ditambahkan.\n`;
                changes++;
            } else {
                msg += `⏭️ *Database:* Full ID sudah ada.\n`;
            }
        } catch (e) {
            msg += `❌ *Database Error:* ${e.message}\n`;
        }

        msg += changes > 0 ? `\n *Berhasil! ID aktif & masuk target BC.*` : `\n⚠️ *Tidak ada perubahan.*`;
        await sock.sendMessage(chatId, { text: msg }, { quoted: m });
    }
};
