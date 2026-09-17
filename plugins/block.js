const config = require('../config');

module.exports = {
    name: 'block',
    alias: ['block'],
    desc: 'Memblokir pengguna berdasarkan nomor/ID.',
    category: 'owner',
    requiredLevel: 1,
    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;
        
        // Bersihkan semua nomor dari karakter aneh
        const senderNum = String(senderNumber || '').replace(/[^0-9]/g, '');
        const mainOwner = String(config.ownerNumber || '').replace(/[^0-9]/g, '');
        const coOwners = Array.isArray(config.coOwnerNumbers) 
            ? config.coOwnerNumbers.map(n => String(n).replace(/[^0-9]/g, '')) 
            : [];

        // Tentukan Level Pengirim
        let senderLevel = 0; // User Biasa
        if (senderNum === mainOwner) senderLevel = 2; // Main Owner
        else if (coOwners.includes(senderNum)) senderLevel = 1; // Co-Owner

        // Validasi Akses Dasar
        if (senderLevel === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ *ACCESS DENIED*\n\nKamu tidak memiliki akses ke command ini.`
            }, { quoted: m });
        }

        // Ambil Target dari Argument (Bukan Reply)
        const rawTarget = args[0];
        if (!rawTarget) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Masukkan nomor target!*\n\nContoh: *${prefix}block 6281234567890*` 
            }, { quoted: m });
        }

        const targetNum = String(rawTarget).replace(/[^0-9]/g, '');
        const targetJid = targetNum + '@s.whatsapp.net';

        // ===== VALIDASI HIERARKI LEVEL =====
        let targetLevel = 0;
        if (targetNum === mainOwner) targetLevel = 2;
        else if (coOwners.includes(targetNum)) targetLevel = 1;

        // Aturan Emas: Tidak boleh mem-block orang yang levelnya sama atau lebih tinggi
        if (targetLevel >= senderLevel) {
            let roleName = targetLevel === 2 ? 'Main Owner' : 'Co-Owner';
            return await sock.sendMessage(chatId, {
                text: `🚫 *HIERARCHY PROTECTED*\n\nKamu (${senderLevel === 2 ? 'Main Owner' : 'Co-Owner'}) tidak diperbolehkan mem-block ${roleName} (+${targetNum}).\n\nSistem menolak perintah ini demi keamanan bot.`
            }, { quoted: m });
        }

        // Eksekusi Block
        try {
            await sock.updateBlockStatus(targetJid, 'block');
            await sock.sendMessage(chatId, { 
                text: `✅ *Berhasil mem-block user!*\nTarget: +${targetNum}\nStatus: Ditolak total oleh bot.` 
            }, { quoted: m });
            
            console.log(`[BLOCK] ${senderNum} (Level ${senderLevel}) berhasil mem-block ${targetNum}`);
        } catch (e) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Gagal mem-block user.*\nTarget: +${targetNum}\nError: ${e.message}` 
            }, { quoted: m });
        }
    }
};
