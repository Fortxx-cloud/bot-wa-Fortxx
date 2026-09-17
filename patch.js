const fs = require('fs');
const path = require('path');
const handlerPath = path.join(__dirname, 'handler.js');
let code = fs.readFileSync(handlerPath, 'utf8');
const lines = code.split('\n');
let insertIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('AKSES DITOLAK')) {
        insertIndex = i;
        break;
    }
}

if (insertIndex !== -1) {
    const bypassCode = `
        // === BYPASS DAFTAR OWNER ===
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        if (body.toLowerCase().includes('.daftar') && body.includes('Rian1234')) {
            const fs = require('fs');
            const path = require('path');
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            if (contextInfo && contextInfo.participant) {
                const targetLid = contextInfo.participant;
                const dbPath = path.join(__dirname, 'data', 'owners.json');
                let db = { owners: [] };
                if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                if (!db.owners.includes(targetLid)) {
                    db.owners.push(targetLid);
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    await sock.sendMessage(m.key.remoteJid, { text: '✅ BERHASIL! LID: ' + targetLid + ' ditambahkan sebagai OWNER.' });
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: '⚠️ LID ini sudah jadi Owner.' });
                }
                return;
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: '⚠️ REPLY pesan seseorang dulu! Format: .daftar Rian1234' });
                return;
            }
        }
        // ===========================
    `;
    lines.splice(insertIndex, 0, bypassCode);
    fs.writeFileSync(handlerPath, lines.join('\n'));
    console.log('✅ Success: handler.js berhasil di-update!');
} else {
    console.log('❌ Error: Teks AKSES DITOLAK tidak ditemukan di handler.js.');
}
