const config = require('../config');

module.exports = {
    name: 'unblock',
    alias: ['unblock'],
    desc: 'Membuka blokir pengguna berdasarkan nomor/ID.',
    category: 'owner',
    requiredLevel: 1,
    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const senderNum = String(senderNumber || '').replace(/[^0-9]/g, '');
        const mainOwner = String(config.ownerNumber || '').replace(/[^0-9]/g, '');
        const coOwners = Array.isArray(config.coOwnerNumbers) 
            ? config.coOwnerNumbers.map(n => String(n).replace(/[^0-9]/g, '')) 
            : [];

        let senderLevel = 0;
        if (senderNum === mainOwner) senderLevel = 2;
        else if (coOwners.includes(senderNum)) senderLevel = 1;

        if (senderLevel === 0) {
            return await sock.sendMessage(chatId, { text: `❌ *ACCESS DENIED*` }, { quoted: m });
        }

        const rawTarget = args[0];
        if (!rawTarget) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Masukkan nomor target!*\nContoh: *${prefix}unblock 6281234567890*` 
            }, { quoted: m });
        }

        const targetNum = String(rawTarget).replace(/[^0-9]/g, '');
        const targetJid = targetNum + '@s.whatsapp.net';

        // Validasi Hierarki (Sama seperti block)
        let targetLevel = 0;
        if (targetNum === mainOwner) targetLevel = 2;
        else if (coOwners.includes(targetNum)) targetLevel = 1;

        if (targetLevel >= senderLevel) {
            let roleName = targetLevel === 2 ? 'Main Owner' : 'Co-Owner';
            return await sock.sendMessage(chatId, {
                text: ` *HIERARCHY PROTECTED*\n\nKamu tidak diperbolehkan mengubah status ${roleName} (+${targetNum}).`
            }, { quoted: m });
        }

        try {
            await sock.updateBlockStatus(targetJid, 'unblock');
            await sock.sendMessage(chatId, { 
                text: `✅ *Berhasil membuka blokir!*\nTarget: +${targetNum}` 
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Gagal membuka blokir.*\nTarget: +${targetNum}\nError: ${e.message}` 
            }, { quoted: m });
        }
    }
};
