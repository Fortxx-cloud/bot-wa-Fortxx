const fs = require('fs');
const path = require('path');

// Fungsi cleanId yang BENAR
const cleanId = (jid) => {
    if (!jid) return null;
    return jid.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
};

module.exports = {
    alias: ['daftar'],
    run: async (sock, m, args, senderId, isOwner, isMember) => {
        const password = 'Rian1234';
        
        // Cek apakah ini command kita
        if (!args.join(' ').includes(password)) return;

        const isMemberCmd = args[0] === 'member';
        const isOwnerCmd = !isMemberCmd;

        // === FALLBACK: CEK OWNER LANGSUNG DARI DATABASE ===
        let isOwnerVerified = isOwner; 
        
        if (!isOwnerVerified) {
            const whitelistPath = path.join(__dirname, '..', 'database', 'whitelist.json');
            if (fs.existsSync(whitelistPath)) {
                const whitelistDb = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
                const cleanSenderId = cleanId(senderId);
                if (whitelistDb.includes(cleanSenderId)) {
                    isOwnerVerified = true;
                }
            }
        }

        //  KEAMANAN MAKSIMAL: Cuma Owner yang boleh nambah Member ATAU Owner baru
        if (!isOwnerVerified) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ *DITOLAK!*\n\nHanya Owner yang berhak menambah Member/Owner.' 
            });
        }

        // Ambil data dari pesan yang di-reply
        const contextInfo = m.message?.extendedTextMessage?.contextInfo;
        if (!contextInfo || !contextInfo.participant) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: '⚠️ *GAGAL!*\n\nKamu harus **REPLY** pesan orangnya.\nFormat Owner: .daftar Rian1234\nFormat Member: .daftar member Rian1234' 
            });
        }

        const targetLid = contextInfo.participant;
        const cleanLid = cleanId(targetLid);

        if (isOwnerCmd) {
            // --- LOGIC TAMBAH OWNER ---
            const ownersPath = path.join(__dirname, '..', 'data', 'owners.json');
            let ownersDb = { owners: [] };
            if (fs.existsSync(ownersPath)) ownersDb = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
            if (!ownersDb.owners.includes(targetLid)) ownersDb.owners.push(targetLid);
            fs.writeFileSync(ownersPath, JSON.stringify(ownersDb, null, 2));

            const whitelistPath = path.join(__dirname, '..', 'database', 'whitelist.json');
            let whitelistDb = [];
            if (fs.existsSync(whitelistPath)) whitelistDb = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
            if (!whitelistDb.includes(cleanLid)) whitelistDb.push(cleanLid);
            fs.writeFileSync(whitelistPath, JSON.stringify(whitelistDb, null, 2));

            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ *OWNER DITAMBAHKAN!*\n\nLID: ${targetLid}\nNomor: ${cleanLid}\n\nSekarang punya akses penuh!` 
            });
        } 
        else if (isMemberCmd) {
            // --- LOGIC TAMBAH MEMBER ---
            const memberPath = path.join(__dirname, '..', 'database', 'members.json');
            let memberDb = [];
            if (fs.existsSync(memberPath)) memberDb = JSON.parse(fs.readFileSync(memberPath, 'utf8'));
            if (!memberDb.includes(cleanLid)) memberDb.push(cleanLid);
            fs.writeFileSync(memberPath, JSON.stringify(memberDb, null, 2));

            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ *MEMBER DITAMBAHKAN!*\n\nNomor: ${cleanLid}\nSekarang bisa akses fitur Member!` 
            });
        }
    }
};
