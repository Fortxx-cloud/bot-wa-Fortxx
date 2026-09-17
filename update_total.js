const fs = require('fs');

console.log('🚀 Memulai Update Total Bot...');

// 1. BERSIHKAN INDEX.JS
let index = fs.readFileSync('index.js', 'utf8');
index = index.replace(/.*clearOldCache.*/g, ''); // Hapus baris clearOldCache
index = index.replace(/\/\/\s*===\s*AUTO CLEAR CACHE[\s\S]*?\/\/\s*={3,}/g, ''); // Hapus blok auto clear
index = index.replace(/require$['"]\.\/backupSession['"]$;?/g, '');
index = index.replace(/require$['"]\.\/autoClearCache['"]$;?/g, '');
fs.writeFileSync('index.js', index);
console.log('✅ index.js dibersihkan.');

// 2. BERSIHKAN HANDLER.JS
let handler = fs.readFileSync('handler.js', 'utf8');
handler = handler.replace(/require$['"]\.\/security['"]$;?/g, '');
handler = handler.replace(/require$['"]\.\/antiLink['"]$;?/g, '');
handler = handler.replace(/.*antiSpam.*/g, '');
handler = handler.replace(/.*checkAntiLink.*/g, '');
fs.writeFileSync('handler.js', handler);
console.log('✅ handler.js dibersihkan.');

// 3. BUAT FILE FITUR BARU

// File Anti-Call
const antiCallCode = `
module.exports = (sock) => {
    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer') {
                console.log('[ANTI-CALL] Memblokir:', call.from);
                try {
                    await sock.sendMessage(call.from, { text: '🚫 *AUTO BLOCK!*\\nBot ini tidak menerima panggilan. Nomor Anda diblokir otomatis.' });
                    await sock.updateBlockStatus(call.from, 'block');
                } catch(e) {}
            }
        }
    });
};
`;
fs.writeFileSync('antiCall.js', antiCallCode);

// File Anti-Link (3x Peringatan)
const antiLinkCode = `
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'db_warnings.json');
let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
function saveDb() { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
const OWNER = '6283169256518@s.whatsapp.net';

module.exports = async (m, sock) => {
    if (!m.isGroup || m.sender === OWNER) return;
    if (m.isAdmin) return; 
    const linkRegex = /(https?:\\/\\/[^\\s]+|wa\\.me\\/[^\\s]+)/gi;
    if (linkRegex.test(m.body || '')) {
        const key = \`\${m.chat}_\${m.sender}\`;
        db[key] = (db[key] || 0) + 1;
        saveDb();
        const count = db[key];
        if (count < 3) {
            return m.reply(\`⚠️ *PERINGATAN \${count}/3*\\n\\nJangan share link! Pelanggaran ke-3 akan di-KICK.\`);
        } else {
            delete db[key]; saveDb();
            await m.reply(\`🚫 *KICK OTOMATIS!*\\nKamu 3x melanggar aturan anti-link.\`);
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
        }
    }
};
`;
fs.writeFileSync('antiLink.js', antiLinkCode);

// File Health Command
const healthCode = `
module.exports = async (m) => {
    if (m.body === '.health' || m.body === '.status') {
        const os = require('os');
        const uptime = process.uptime();
        const jam = Math.floor(uptime / 3600);
        const menit = Math.floor((uptime % 3600) / 60);
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
        return m.reply(\` *BOT HEALTH STATUS*\\n\\n️ *Uptime:* \${jam} Jam \${menit} Menit\\n🧠 *RAM:* \${ram} MB / \${totalRam} MB\`);
    }
};
`;
fs.writeFileSync('health.js', healthCode);

console.log('✅ File fitur baru dibuat.');

// 4. SUNTIKKAN KODE KE INDEX.JS & HANDLER.JS (AMAN)

// Suntik Anti-Call ke index.js
if (!index.includes('./antiCall')) {
    // Cari blok connection open, kalau gak ketemu tempel di bawah
    if (index.includes('connection === "open"')) {
        index = index.replace('connection === "open"', 'connection === "open"'); // dummy
        index = index.replace(/(if\s*$connection\s*===\s*["']open["']$\s*\{)/, '$1\n    require("./antiCall")(sock);');
    } else {
        index += '\nrequire("./antiCall")(sock);\n';
    }
    fs.writeFileSync('index.js', index);
    console.log('✅ Anti-Call disuntikkan ke index.js');
}

// Suntik Fitur ke handler.js
if (!handler.includes('./antiLink') || !handler.includes('./health')) {
    let injections = '';
    if (!handler.includes('./antiLink')) injections += 'const checkAntiLink = require("./antiLink");\n';
    if (!handler.includes('./health')) injections += 'const checkHealth = require("./health");\n';
    
    handler = injections + handler;
    
    // Cari tempat aman untuk inject (setelah deklarasi module.exports atau di awal fungsi)
    const injectLogic = `\n    if (m) { await checkAntiLink(m, sock); await checkHealth(m); }\n`;
    
    if (handler.includes('module.exports = async')) {
        handler = handler.replace(/module\.exports\s*=\s*async\s*$[^)]*$\s*=>\s*\{/, '$&' + injectLogic);
    } else if (handler.includes('exports.handler = async')) {
        handler = handler.replace(/exports\.handler\s*=\s*async\s*$[^)]*$\s*=>\s*\{/, '$&' + injectLogic);
    } else {
        handler += injectLogic; // Fallback aman
    }
    fs.writeFileSync('handler.js', handler);
    console.log('✅ Anti-Link & Health disuntikkan ke handler.js');
}

console.log(' UPDATE TOTAL SELESAI! Silakan restart bot.');
