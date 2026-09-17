const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '../database', 'users.json');
const LOGS_PATH = path.join(__dirname, '../database', 'bc_logs.json');

const readJson = (p) => {
    try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : []; }
    catch { return []; }
};
const writeJson = (p, d) => {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

const toJid = (raw) => {
    if (!raw) return null;
    let s = String(raw).trim().replace(/[^0-9]/g, '');
    return s ? `${s}@s.whatsapp.net` : null;
};

module.exports = {
    name: 'bc',
    alias: ['bc', 'broadcast'],
    desc: 'Broadcast pesan ke semua user di database',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;

        // MODE 1: Reply media/gambar -> Share/Forward mode
        if (m.quoted) {
            const targets = readJson(USERS_PATH);
            if (targets.length === 0) {
                return await sock.sendMessage(chatId, { text: '❌ Database user kosong.' }, { quoted: m });
            }

            const extraText = args.join(' ') || '';
            await sock.sendMessage(chatId, {
                text: `⏳ *Share Broadcast*\n🎯 Target: ${targets.length} user`
            }, { quoted: m });

            let success = 0, fail = 0;
            const originalMsg = m.quoted.message;

            for (const user of targets) {
                try {
                    const jid = toJid(user);
                    if (!jid) { fail++; continue; }

                    // Tambah caption kalau ada teks tambahan
                    if (extraText) {
                        const msgType = Object.keys(originalMsg)[0];
                        if (originalMsg[msgType]?.caption) {
                            originalMsg[msgType].caption += `\n\n${extraText}`;
                        } else if (msgType === 'conversation') {
                            originalMsg.extendedTextMessage = { text: `${originalMsg.conversation}\n\n${extraText}` };
                            delete originalMsg.conversation;
                        }
                    }

                    await sock.relayMessage(jid, originalMsg, { messageId: m.quoted.key.id });
                    success++;
                    await new Promise(r => setTimeout(r, 800));
                } catch (err) {
                    fail++;
                    console.error(`[BC] Fail ${user}:`, err.message);
                }
            }

            return await sock.sendMessage(chatId, {
                text: `✅ *Selesai!*\n✔️ ${success} | ❌ ${fail}\n📊 Total: ${targets.length}`
            }, { quoted: m });
        }

        // MODE 2: Ketik langsung .bc pesan -> Text broadcast
        const message = args.join(' ');
        if (!message) {
            return await sock.sendMessage(chatId, {
                text: `️ *Cara Pakai:*\n\n1. *${prefix}bc Halo semua!* (langsung kirim teks)\n2. Reply pesan + *${prefix}bc Caption* (share/forward mode)`
            }, { quoted: m });
        }

        const targets = readJson(USERS_PATH);
        if (targets.length === 0) {
            return await sock.sendMessage(chatId, { text: '❌ Database user kosong.' }, { quoted: m });
        }

        await sock.sendMessage(chatId, {
            text: ` *Broadcast Teks*\n Target: ${targets.length} user\n Pesan: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
        }, { quoted: m });

        let success = 0, fail = 0;

        for (const user of targets) {
            try {
                const jid = toJid(user);
                if (!jid) { fail++; continue; }

                await sock.sendMessage(jid, { text: message });
                success++;
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                fail++;
                console.error(`[BC] Fail ${user}:`, err.message);
            }
        }

        await sock.sendMessage(chatId, {
            text: `✅ *Broadcast Selesai!*\n✔️ Berhasil: ${success}\n❌ Gagal: ${fail}\n📊 Total: ${targets.length}`
        }, { quoted: m });
    }
};
