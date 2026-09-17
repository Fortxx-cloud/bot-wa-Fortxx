const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '../database', 'users.json');

module.exports = {
    name: 'listuser',
    alias: ['listuser', 'users', 'daftaruser', 'lu'],
    desc: 'Menampilkan daftar user yang terdaftar di database bot',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m, prefix }) => {
        const chatId = m.key.remoteJid;
        
        // Baca database users
        let users = [];
        try {
            if (fs.existsSync(USERS_PATH)) {
                users = JSON.parse(fs.readFileSync(USERS_PATH));
            }
        } catch (e) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *ERROR BACA DATABASE*\n${e.message}` 
            }, { quoted: m });
        }

        if (users.length === 0) {
            return await sock.sendMessage(chatId, { 
                text: `📭 *DATABASE KOSONG*\nBelum ada user yang terdaftar.` 
            }, { quoted: m });
        }

        // Format tampilan list user
        let userList = `╔══════════════════════════════╗
║   👥 *DAFTAR USER TERDAFTAR*   ║
╚══════════════════════════════╝

📊 *Total User:* ${users.length}

`;

        users.forEach((user, index) => {
            let displayId = user;
            let status = '✅';
            
            // Normalisasi tampilan ID
            if (typeof user === 'string') {
                if (!user.includes('@')) {
                    displayId = `${user}@s.whatsapp.net`;
                    status = '️'; // Warning karena belum ada domain
                }
            } else if (typeof user === 'object') {
                displayId = user.jid || user.id || user.number || 'Unknown';
                if (displayId && !String(displayId).includes('@')) {
                    displayId = `${displayId}@s.whatsapp.net`;
                    status = '️';
                }
            }

            userList += `${index + 1}. ${status} \`${displayId}\`\n`;
        });

        userList += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Tips:*
• ⚠️ = ID belum lengkap (auto-fix saat broadcast)
• Gunakan .bc untuk kirim pesan ke semua user
• Pastikan nomor WA aktif & terdaftar

💎 *Vurx12 Premium User Manager*`.trim();

        await sock.sendMessage(chatId, { text: userList }, { quoted: m });
    }
};
