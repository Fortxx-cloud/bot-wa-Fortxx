const config = require('../config');

module.exports = {
    name: 'halo',
    alias: ['halo', 'hi', 'test'],
    desc: 'Cek status bot dan sapa owner.',
    category: 'general',
    run: async ({ sock, m, prefix, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const now = new Date().toLocaleString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });

        const haloText = `
╔══════════════════════════════╗
║      👋 *HALO USER!*         ║
╚══════════════════════════════╝

✨ *Vurx12 Premium Bot* sedang 
*ONLINE* dan siap melayani!

🆔 *User ID:* \`${senderNumber}\`
 *Waktu Server:* _${now}_
📡 *Status:* 🟢 *ACTIVE*
🛡️ *Security:* Wabase-MD Protocol

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ketik *${prefix}menu* untuk melihat 
daftar fitur premium yang tersedia.

💎 *Made with ❤️ by FORTXX © 2026*
        `.trim();

        await sock.sendMessage(chatId, { text: haloText }, { quoted: m });
    }
};
