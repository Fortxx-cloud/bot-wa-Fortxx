
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'db_warnings.json');
let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
function saveDb() { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
const OWNER = '6283169256518@s.whatsapp.net';

module.exports = async (m, sock) => {
    if (!m.isGroup || m.sender === OWNER) return;
    if (m.isAdmin) return; 
    const linkRegex = /(https?:\/\/[^\s]+|wa\.me\/[^\s]+)/gi;
    if (linkRegex.test(m.body || '')) {
        const key = `${m.chat}_${m.sender}`;
        db[key] = (db[key] || 0) + 1;
        saveDb();
        const count = db[key];
        if (count < 3) {
            return m.reply(`⚠️ *PERINGATAN ${count}/3*\n\nJangan share link! Pelanggaran ke-3 akan di-KICK.`);
        } else {
            delete db[key]; saveDb();
            await m.reply(`🚫 *KICK OTOMATIS!*\nKamu 3x melanggar aturan anti-link.`);
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
        }
    }
};
