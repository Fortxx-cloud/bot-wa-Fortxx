const config = require('../config');

module.exports = {
    name: 'owner',
    alias: ['owner', 'creator', 'dev'],
    desc: 'Menampilkan informasi Owner, Co-Owner, dan daftar command khusus.',
    category: 'owner',
    requiredLevel: 1,
    run: async ({ sock, m, prefix, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const senderNum = String(senderNumber || '').replace(/[^0-9]/g, '');
        const mainOwner = String(config.ownerNumber || '').replace(/[^0-9]/g, '');
        const coOwners = Array.isArray(config.coOwnerNumbers) 
            ? config.coOwnerNumbers.map(n => String(n).replace(/[^0-9]/g, '')) 
            : [];

        const isMainOwner = senderNum === mainOwner;
        const isCoOwner = coOwners.includes(senderNum);

        // Validasi Akses
        if (!isMainOwner && !isCoOwner) {
            return await sock.sendMessage(chatId, {
                text: `❌ *ACCESS DENIED*\n\nNomor kamu (*+${senderNum}*) tidak terdaftar!\n\nHanya Main Owner (+${mainOwner}) dan Co-Owner resmi yang bisa akses.`
            }, { quoted: m });
        }

        const ownerText = `
╔═══════════════════════════════╗
║   👑 *OWNER INFO* 👑          ║
╚═══════════════════════════════╝

👤 *Nama:* ${config.ownerName || 'FORTXX'}
👑 *Main Owner:* +${mainOwner}
🛡️ *Co-Owners:* ${coOwners.length > 0 ? coOwners.map(n => '+'+n).join(', ') : 'Tidak ada'}
💻 *Platform:* Wabase-MD (Node.js)
📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ *Waktu:* ${new Date().toLocaleTimeString('id-ID')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *DAFTAR COMMAND OWNER/CO-OWNER:*
• .block / .unblock → Block/Unblock user
• .setppbot / .setppgc → Ganti foto profil
• .restart → Restart bot
• .autoread / .autotyping → Toggle fitur
• .join / .leave → Kelola grup
• .bc → Broadcast pesan
• .take → Ganti metadata stiker
• .listuser → Lihat database user
• .shutdown → Matikan bot *(Main Only)*
• .setname / .setbio → Ubah profil bot *(Main Only)*
• .mode / .setprefix → Kontrol sistem *(Main Only)*
• .eval / .exec → Developer tools *(Main Only)*

Hubungi Main Owner untuk request fitur atau laporan bug!
        `.trim();

        await sock.sendMessage(chatId, {
            text: ownerText,
            mentions: [mainOwner + '@s.whatsapp.net', ...coOwners.map(n => n + '@s.whatsapp.net')]
        }, { quoted: m });
    }
};
