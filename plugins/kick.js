module.exports = {
    name: 'kick',
    alias: ['k', 'remove'],
    desc: 'Kick member dari grup',
    category: 'group',
    async run({ sock, m, args }) {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(m.key.remoteJid, { text: 'Khusus grup!' }, { quoted: m });
        }
        const groupJid = m.key.remoteJid;
        const meta = await sock.groupMetadata(groupJid);
        let botData = null;
        for (let p of meta.participants) {
            if (p.id.includes('6288994324184') || p.id.includes('70124551819326')) {
                botData = p;
                break;
            }
        }
        if (!botData || !botData.admin) {
            return await sock.sendMessage(groupJid, { text: '❌ Bot harus jadi admin grup dulu!' }, { quoted: m });
        }
        let targetJid = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            targetJid = args[0].replace('@', '') + '@s.whatsapp.net';
        }
        if (!targetJid) {
            return await sock.sendMessage(groupJid, { text: '❌ Mention atau masukkan nomor target!' }, { quoted: m });
        }
        const targetData = meta.participants.find(p => p.id === targetJid);
        if (!targetData) {
            return await sock.sendMessage(groupJid, { text: '❌ Target tidak ada di grup!' }, { quoted: m });
        }
        if (targetData.admin) {
            return await sock.sendMessage(groupJid, { text: '❌ Tidak bisa kick admin!' }, { quoted: m });
        }
        try {
            await sock.groupParticipantsUpdate(groupJid, [targetJid], 'remove');
            await sock.sendMessage(groupJid, { text: '✅ Berhasil kick!' }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(groupJid, { text: ' Gagal: ' + e.message }, { quoted: m });
        }
    }
};

