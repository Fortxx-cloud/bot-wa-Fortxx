module.exports = {
    name: 'link',
    alias: ['linkgc', 'grouplink'],
    desc: 'Ambil link invite grup',
    category: 'group',
    async run({ sock, m }) {
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
            return await sock.sendMessage(groupJid, { text: '❌ Bot harus jadi admin grup dulu untuk mengambil link!' }, { quoted: m });
        }
        
        try {
            const code = await sock.groupInviteCode(groupJid);
            const link = `https://chat.whatsapp.com/${code}`;
            const res = `*Link Grup:* ${meta.subject}\n\n${link}`;
            await sock.sendMessage(groupJid, { text: res }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(groupJid, { text: '❌ Gagal mengambil link: ' + e.message }, { quoted: m });
        }
    }
};

