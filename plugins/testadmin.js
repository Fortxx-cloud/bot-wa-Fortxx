module.exports = {
    name: 'testadmin',
    alias: ['cekadmin'],
    desc: 'Cek status admin',
    category: 'debug',
    async run({ sock, m }) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(m.key.remoteJid, { text: 'Khusus grup!' }, { quoted: m });
        }
        const groupJid = m.key.remoteJid;
        const senderJid = m.key.participant || m.key.remoteJid;
        const meta = await sock.groupMetadata(groupJid);
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        let botData = null;
        for (let p of meta.participants) {
            if (p.id.includes('6288994324184') || p.id.includes('70124551819326')) {
                botData = p;
                break;
            }
        }
        const senderData = meta.participants.find(p => p.id === senderJid);
        let res = 'DEBUG ADMIN v3\n\n';
        res += 'Bot Number: ' + botNumber + '\n';
        res += 'Bot Found: ' + (botData ? 'YA' : 'TIDAK') + '\n';
        if (botData) {
            res += 'Bot JID di Grup: ' + botData.id + '\n';
            res += 'Bot Admin: ' + (botData.admin || 'TIDAK') + '\n';
        } else {
            res += 'Bot Admin: TIDAK TERDETEKSI\n';
        }
        res += 'Sender Admin: ' + (senderData && senderData.admin ? senderData.admin : 'TIDAK') + '\n';
        res += 'Total Participants: ' + meta.participants.length + '\n';
        await sock.sendMessage(groupJid, { text: res }, { quoted: m });
    }
};

