const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const autoClean = require('../auto-clean');

function loadHandler() {
    const handlerPath = require.resolve('../handler');
    delete require.cache[handlerPath];
    return require(handlerPath);
}

let handleMessage = loadHandler();

if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions');
}

exports.createConnection = new Promise(async (resolve, reject) => {
    try {
        const startSock = async () => {
            const { state, saveCreds } = await useMultiFileAuthState('./sessions');
            const sock = makeWASocket({
                auth: state,
                browser: ['Wabase-MD', 'Chrome', '3.0'],
                printQRInTerminal: false,
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log('\n📱 SCAN QR CODE TIK:\n');
                    qrcode.generate(qr, { small: true });
                    console.log('\nMenunggu scan...\n');
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('⚠️  Koneksi terputus, mencoba reconnect...', shouldReconnect);
                    if (shouldReconnect) startSock();
                } else if (connection === 'open') {
                    console.log('✅ Bot berhasil terhubung ke WhatsApp!');
                    resolve(sock);
                }
            });

            sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const msg of messages) {

                    const teks = msg.message?.conversation 
                        || msg.message?.extendedTextMessage?.text 
                        || '';
                    console.log(`[MASUK] Pesan: ${teks}`);

                    // === FITUR AUTO HAPUS LINK (ANTI-LINK) ===
                    if (msg.key.remoteJid.endsWith('@g.us')) {
                        const chatText = teks || '';
                        const linkRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,22})|https?:\/\/[^\s]+/i;

                        if (linkRegex.test(chatText)) {
                            const meta = await sock.groupMetadata(msg.key.remoteJid);
                            let senderData = meta.participants.find(p => p.id === msg.key.participant);
                            let botData = null;
                            for (let p of meta.participants) {
                                if (p.id.includes('6288994324184') || p.id.includes('70124551819326')) {
                                    botData = p;
                                    break;
                                }
                            }

                            if (senderData && senderData.admin && botData && botData.admin) {
                                await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
                                await sock.sendMessage(msg.key.remoteJid, {
                                    text: `️ @${msg.key.participant.split('@')[0]} dilarang share link di grup ini!`,
                                    mentions: [msg.key.participant]
                                });
                                continue;
                            }
                        }
                    }
                    // === AKHIR FITUR ANTI-LINK ===

                    // Reload handler setiap ada pesan (untuk hot reload)
                    try {
                        handleMessage = loadHandler();
                    } catch (e) {
                        console.error('[RELOAD HANDLER ERROR]', e.message);
                    }

                    await handleMessage(sock, msg);
                }
            });

            // === FITUR WELCOME & GOODBYE ===
            sock.ev.on('group-participants.update', async (anu) => {
                console.log('[EVENT] Update Member Grup:', anu);
                try {
                    const metadata = await sock.groupMetadata(anu.id);
                    const groupName = metadata.subject;
                    const participants = Object.keys(anu.participants);

                    for (const num of participants) {
                        const mention = `@${num.split('@')[0]}`;

                        if (anu.action === 'add') {
                            const welcomeText = `Halo ${mention} 👋\nSelamat datang di grup *${groupName}*!\nSemoga betah ya, jangan lupa baca deskripsi grup.`;
                            await sock.sendMessage(anu.id, {
                                text: welcomeText,
                                mentions: [num]
                            });
                        } else if (anu.action === 'remove') {
                            const goodbyeText = `Sampai jumpa ${mention} 👋\nTelah meninggalkan grup *${groupName}*.\nHati-hati di jalan!`;
                            await sock.sendMessage(anu.id, {
                                text: goodbyeText,
                                mentions: [num]
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error di Welcome/Goodbye:', err);
                }
            });
            // === AKHIR FITUR WELCOME & GOODBYE ===
        };

        startSock();
    } catch (e) {
        reject(e);
        console.error('Error saat membuat koneksi:', e);
    }
});
