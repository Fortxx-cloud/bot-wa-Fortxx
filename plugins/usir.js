const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['usir', 'kick', 'remove'],
    desc: 'Mengusir member (WAJIB reply pesan target)',
    ownerOnly: true,
    run: async ({ sock, m }) => {
        // 1. DETEKSI REPLY DENGAN CARA LEBIH FLEKSIBEL
        let quotedMsg = null;
        
        // Cek berbagai kemungkinan struktur quoted message
        if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            quotedMsg = m.message.extendedTextMessage.contextInfo;
        } else if (m.quoted && m.quoted.sender) {
            quotedMsg = { participant: m.quoted.sender };
        }

        if (!quotedMsg || !quotedMsg.participant) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ *Format Salah!*\n\nReply pesan member yang mau diusir, lalu ketik *.usir*' 
            }, { quoted: m });
        }

        // 2. AMBIL ID ASLI DARI PESAN YANG DI-REPLY
        const rawSender = quotedMsg.participant;
        const targetId = rawSender.replace(/[^0-9]/g, '').split(':')[0];

        // 3. JANGAN USIR OWNER / CO-OWNER
        const whitelistPath = path.join(__dirname, '..', 'database', 'whitelist.json');
        let WHITELIST_IDS = fs.existsSync(whitelistPath) ? JSON.parse(fs.readFileSync(whitelistPath)) : [];
        
        if (WHITELIST_IDS.includes(targetId)) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '🚫 *Gagal!* Target adalah Owner/Co-Owner dan tidak bisa diusir.' 
            }, { quoted: m });
        }

        // 4. HAPUS DARI members.json
        const memberPath = path.join(__dirname, '..', 'database', 'members.json');
        let members = fs.existsSync(memberPath) ? JSON.parse(fs.readFileSync(memberPath)) : [];
        
        const index = members.indexOf(targetId);
        let removed = false;
        
        if (index !== -1) {
            members.splice(index, 1);
            fs.writeFileSync(memberPath, JSON.stringify([...new Set(members)], null, 2));
            removed = true;
        }

        // 5. KONFIRMASI
        await sock.sendMessage(m.key.remoteJid, { 
            text: removed 
                ? `✅ *BERHASIL DIUSIR!*\n\n🆔 *ID/LID:* ${targetId}\n *Status: Akses dicabut permanen.*` 
                : `️ *Target tidak ditemukan di database member.*` 
        }, { quoted: m });
    }
};
