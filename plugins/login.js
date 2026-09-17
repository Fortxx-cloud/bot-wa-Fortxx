const fs = require('fs');
const path = require('path');

// GANTI PASSWORD INI SESUAI KEINGINAN LO
const LOGIN_PASSWORD = "rianto123"; 

module.exports = {
    alias: ['login', 'auth'],
    desc: 'Login sebagai Owner Self-Bot (Otomatis simpan LID)',
    run: async ({ sock, m, args }) => {
        // 1. HANYA BISA DIPAKAI DI CHAT DIRI SENDIRI
        if (!m.key.fromMe) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '🚫 *Command ini hanya bisa digunakan di chat Diri Sendiri!*' 
            }, { quoted: m });
        }

        const inputPass = args.join(' ');
        
        // 2. CEK PASSWORD
        if (!inputPass || inputPass !== LOGIN_PASSWORD) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ *Password Salah!*\nFormat: *.login [password]*' 
            }, { quoted: m });
        }

        // 3. AMBIL LID & NOMOR DARI SESI BOT YANG AKTIF
        const botLidRaw = sock.user?.lid; 
        const botNumberRaw = sock.user?.id;
        
        const cleanId = (jid) => jid ? jid.replace(/[^0-9]/g, '').split(':')[0] : null;
        const botLid = cleanId(botLidRaw);
        const botNumber = cleanId(botNumberRaw);

        if (!botLid && !botNumber) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '️ *Gagal mendeteksi ID Sesi Bot.*\nCoba restart bot dan ketik .login lagi.' 
            }, { quoted: m });
        }

        // 4. SIMPAN OTOMATIS KE members.json & whitelist.json
        const memberPath = path.join(__dirname, '..', 'database', 'members.json');
        const whitelistPath = path.join(__dirname, '..', 'database', 'whitelist.json');
        
        let members = fs.existsSync(memberPath) ? JSON.parse(fs.readFileSync(memberPath)) : [];
        let owners = fs.existsSync(whitelistPath) ? JSON.parse(fs.readFileSync(whitelistPath)) : [];

        let addedCount = 0;
        
        // Simpan LID (Prioritas Utama untuk MD)
        if (botLid && !members.includes(botLid)) { members.push(botLid); addedCount++; }
        if (botLid && !owners.includes(botLid)) { owners.push(botLid); addedCount++; }
        
        // Simpan Nomor HP (Backup)
        if (botNumber && !members.includes(botNumber)) { members.push(botNumber); addedCount++; }
        if (botNumber && !owners.includes(botNumber)) { owners.push(botNumber); addedCount++; }

        fs.writeFileSync(memberPath, JSON.stringify([...new Set(members)], null, 2));
        fs.writeFileSync(whitelistPath, JSON.stringify([...new Set(owners)], null, 2));

        await sock.sendMessage(m.key.remoteJid, { 
            text: `✅ *LOGIN BERHASIL!*\n\n🆔 *LID Tersimpan:* ${botLid || '-'}\n📱 *Nomor Tersimpan:* ${botNumber || '-'}\n\n *Status: Full Access Granted*\nSekarang lo bisa pakai semua command di chat ini!` 
        }, { quoted: m });
    }
};
