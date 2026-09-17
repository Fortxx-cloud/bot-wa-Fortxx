module.exports = {
    name: 'tagall',
    alias: ['mentionall', 'everyone'],
    desc: 'Mention semua member di grup',
    category: 'group',
    async run({ sock, m, args }) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(m.key.remoteJid, { text: 'Khusus grup!' }, { quoted: m });
        }
        const groupJid = m.key.remoteJid;
        const meta = await sock.groupMetadata(groupJid);
        const participants = meta.participants;
        
        if (participants.length === 0) {
            return await sock.sendMessage(groupJid, { text: '❌ Tidak ada member di grup!' }, { quoted: m });
        }
        
        // Ambil pesan dari argumen (opsional)
        const message = args.length > 0 ? args.join(' ') : '📢 Perhatian semua member!';
        
        // Buat list mention
        let mentionText = `*${message}*\n\n`;
        const mentionedJid = [];
        
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];
            const number = participant.id.split('@')[0];
            mentionText += `${i + 1}. @${number}\n`;
            mentionedJid.push(participant.id);
        }
        
        mentionText += `\nTotal: ${participants.length} member`;
        
        try {
            await sock.sendMessage(groupJid, { 
                text: mentionText,
                mentions: mentionedJid
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(groupJid, { text: ' Gagal mention semua: ' + e.message }, { quoted: m });
        }
    }
};

