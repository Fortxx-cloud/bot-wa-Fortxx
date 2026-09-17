const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['addowner', 'jadikanowner'],
    desc: 'Menambahkan user menjadi Owner/Co-Owner secara permanen',
    run: async ({ sock, m, args, addToWhitelist, senderId }) => {
        // Validasi: Hanya owner utama yang boleh nambah owner lain
        if (senderId !== '268921357783190') {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '🚫 *Akses Ditolak!* Hanya Owner Utama yang dapat menambahkan Co-Owner.' 
            }, { quoted: m });
        }

        const targetRaw = args[0];
        if (!targetRaw) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ Format salah!\nGunakan: *.addowner @tag* atau *.addowner 628xxx*' 
            }, { quoted: m });
        }

        // Bersihkan ID target
        const targetId = targetRaw.replace(/[^0-9]/g, '').split(':')[0];
        
        if (!targetId || targetId.length < 10) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ ID tidak valid!' 
            }, { quoted: m });
        }

        // Panggil fungsi auto-update whitelist dari handler
        const success = addToWhitelist(targetId);

        if (success) {
            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ *BERHASIL!*\n\n@${targetId} telah ditambahkan sebagai **Owner/Co-Owner**.\n\n⚠️ *PENTING:* Bot akan restart otomatis dalam 3 detik agar perubahan whitelist terbaca.` 
            }, { quoted: m });
            
            // Auto-restart agar file handler.js yang baru dimuat ulang
            setTimeout(() => {
                const { exec } = require('child_process');
                exec('pm2 restart vurx12-bot');
            }, 3000);
            
        } else {
            await sock.sendMessage(m.key.remoteJid, { 
                text: `️ @${targetId} sudah terdaftar sebagai Owner.` 
            }, { quoted: m });
        }
    }
};
