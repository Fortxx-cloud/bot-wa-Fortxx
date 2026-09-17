const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    name: 'blacklist',
    alias: ['addblacklist', 'delblacklist', 'listblacklist'],
    desc: 'Mengelola daftar User ID yang aksesnya dicabut.',
    category: 'owner',
    requiredLevel: 1,
    run: async ({ sock, m, prefix, args, command, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const mainOwner = String(config.ownerNumber || '').replace(/[^0-9]/g, '');
        const coOwners = Array.isArray(config.coOwnerNumbers) 
            ? config.coOwnerNumbers.map(n => String(n).replace(/[^0-9]/g, '')) 
            : [];

        if (senderNumber !== mainOwner && !coOwners.includes(senderNumber)) {
            return await sock.sendMessage(chatId, { text: `❌ *ACCESS DENIED*` }, { quoted: m });
        }

        const blacklistPath = path.join(__dirname, '../database', 'blacklist.json');
        if (!fs.existsSync(blacklistPath)) fs.writeFileSync(blacklistPath, '[]');
        
        let blacklistedUsers = JSON.parse(fs.readFileSync(blacklistPath));
        const currentTime = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        // ===== TAMBAH KE BLACKLIST =====
        if (command === 'addblacklist') {
            const rawTarget = args[0];
            if (!rawTarget) return await sock.sendMessage(chatId, { text: `❌ *Masukkan User ID target!*\nContoh: *${prefix}addblacklist 6281234567890*` }, { quoted: m });

            const targetNum = String(rawTarget).replace(/[^0-9]/g, '');
            
            if (targetNum === mainOwner || coOwners.includes(targetNum)) {
                return await sock.sendMessage(chatId, { text: `🚫 *HIERARCHY PROTECTED*\n\nTidak bisa mencabut akses Owner/Co-Owner.` }, { quoted: m });
            }

            if (blacklistedUsers.includes(targetNum)) {
                return await sock.sendMessage(chatId, { text: `⚠️ *User ID ${targetNum} sudah ada di blacklist.*` }, { quoted: m });
            }

            blacklistedUsers.push(targetNum);
            fs.writeFileSync(blacklistPath, JSON.stringify(blacklistedUsers, null, 2));
            
            const addMsg = `
╔══════════════════════════════════╗
║     ✅ *AKSES DICABUT* ✅        ║
╚══════════════════════════════════╝

️ *Security Action Successful*

🆔 *User ID:* \`${targetNum}\`
 *Executed By:* \`${senderNumber}\`
📅 *Timestamp:* _${currentTime}_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User ID tersebut sekarang berada di 
*Blacklist Database*. Seluruh akses 
command bot telah ditolak.

🔒 *Wabase-MD Security Protocol*
            `.trim();

            await sock.sendMessage(chatId, { text: addMsg }, { quoted: m });
            return;
        }

        // ===== HAPUS DARI BLACKLIST =====
        if (command === 'delblacklist') {
            const rawTarget = args[0];
            if (!rawTarget) return await sock.sendMessage(chatId, { text: `⚠️ *Masukkan User ID target!*\nContoh: *${prefix}delblacklist 6281234567890*` }, { quoted: m });

            const targetNum = String(rawTarget).replace(/[^0-9]/g, '');
            const index = blacklistedUsers.indexOf(targetNum);

            if (index === -1) {
                return await sock.sendMessage(chatId, { text: `⚠️ *User ID ${targetNum} tidak ada di blacklist.*` }, { quoted: m });
            }

            blacklistedUsers.splice(index, 1);
            fs.writeFileSync(blacklistPath, JSON.stringify(blacklistedUsers, null, 2));
            
            const delMsg = `
╔══════════════════════════════════╗
║     ✅ *AKSES DIPULIHKAN* ✅     ║
╚══════════════════════════════════╝

🛡️ *Security Action Successful*

 *User ID:* \`${targetNum}\`
👤 *Executed By:* \`${senderNumber}\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User ID tersebut telah dihapus dari 
*Blacklist Database*. Akses command 
bot telah dipulihkan.

🔓 *Wabase-MD Security Protocol*
            `.trim();

            await sock.sendMessage(chatId, { text: delMsg }, { quoted: m });
            return;
        }

        // ===== LIHAT DAFTAR BLACKLIST =====
        if (command === 'listblacklist') {
            if (blacklistedUsers.length === 0) {
                return await sock.sendMessage(chatId, { text: `📋 *Daftar blacklist kosong.*\nSemua User ID memiliki akses normal.` }, { quoted: m });
            }
            
            const listText = blacklistedUsers.map((u, i) => `🆔 *User ID ${i+1}:* \`${u}\``).join('\n');
            const listMsg = `
══════════════════════════════════╗
║     *DAFTAR BLACKLIST* 🚫      
╚══════════════════════════════════╝

👥 *Total Blocked IDs:* ${blacklistedUsers.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${listText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User ID di daftar ini tidak bisa 
menggunakan command bot.

🔒 *Wabase-MD Security Protocol*
            `.trim();

            await sock.sendMessage(chatId, { text: listMsg }, { quoted: m });
            return;
        }
    }
};
