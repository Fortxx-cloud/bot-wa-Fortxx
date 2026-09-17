const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['addmember', 'member', 'daftar'],
    run: async ({ sock, m, args, senderId }) => {
        const whitelistPath = path.join(__dirname, '..', 'database', 'whitelist.json');
        let WHITELIST_IDS = fs.existsSync(whitelistPath) ? JSON.parse(fs.readFileSync(whitelistPath)) : ['268921357783190'];

        if (!WHITELIST_IDS.includes(senderId)) {
            return await sock.sendMessage(m.key.remoteJid, { text: '🚫 *Akses Ditolak!* Hanya Owner.' }, { quoted: m });
        }

        let targetId = null;
        let source = '';

        // 1. PRIORITAS: REPLY PESAN (Paling Akurat buat narik LID asli)
        if (m.quoted && m.quoted.sender) {
            const rawJid = m.quoted.sender;
            targetId = rawJid.replace(/[^0-9]/g, '').split(':')[0];
            source = 'Reply Pesan (Auto-Detect LID/No)';
        } 
        // 2. FALLBACK: KETIK NOMOR MANUAL
        else if (args[0]) {
            const targetNumber = args[0].replace(/[^0-9]/g, '');
            if (targetNumber.length < 10) return await sock.sendMessage(m.key.remoteJid, { text: '❌ Nomor tidak valid!' }, { quoted: m });
            
            targetId = targetNumber;
            source = 'Input Manual';
            
            // Coba resolve LID (kalau privasi off, bakal dapet LID)
            try {
                const [res] = await sock.onWhatsApp(`${targetNumber}@s.whatsapp.net`);
                if (res && res.lid) {
                    targetId = res.lid.split('@')[0];
                    source = 'Resolve LID Server';
                }
            } catch (e) {}
        } 
        else {
            return await sock.sendMessage(m.key.remoteJid, { text: '❌ Format salah!\n*Reply pesan target* atau ketik: *.addmember 628xxx*' }, { quoted: m });
        }

        // Simpan ke members.json
        const memberPath = path.join(__dirname, '..', 'database', 'members.json');
        let members = fs.existsSync(memberPath) ? JSON.parse(fs.readFileSync(memberPath)) : [];
        
        let added = false;
        if (!members.includes(targetId)) {
            members.push(targetId);
            fs.writeFileSync(memberPath, JSON.stringify([...new Set(members)], null, 2));
            added = true;
        }

        await sock.sendMessage(m.key.remoteJid, { 
            text: `✅ *BERHASIL DIDAFTARKAN!*\n\n🆔 *ID Tersimpan:* ${targetId}\n📡 *Sumber:* ${source}\n\n${added ? ' *Status: Member Aktif Instan!*' : '⚠️ *Sudah terdaftar.*'}` 
        }, { quoted: m });
    }
};
