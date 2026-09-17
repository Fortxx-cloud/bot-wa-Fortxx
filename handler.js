const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════╗');
console.log('║   HANDLER.JS v4.0 - PREMIUM USER ID UI    ║');
console.log('╚═══════════════════════════════════════════╝');

const config = require('./config');
const PREFIX = '.';
const PLUGINS_DIR = path.join(__dirname, 'plugins');

// ===== FUNGSI BERSIHKAN JID =====
function cleanJid(jid) {
    if (!jid) return null;
    return jid.replace(/[^0-9]/g, '').split('@')[0];
}

// ===== DATABASE USER AUTO-SAVE =====
function saveUserToDatabase(senderNum) {
    try {
        const dbDir = path.join(__dirname, 'database');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

        const dbPath = path.join(dbDir, 'users.json');
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '[]');

        let users = JSON.parse(fs.readFileSync(dbPath));
        if (!users.includes(senderNum)) {
            users.push(senderNum);
            fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
            console.log(`[+] User baru terdaftar: ${senderNum}`);
            return true;
        }
        return false;
    } catch (e) {
        console.error('[USER SAVE ERROR]', e.message);
        return false;
    }
}

// ===== LOAD PLUGINS =====
const plugins = {};
function loadPlugins() {
    if (!fs.existsSync(PLUGINS_DIR)) {
        console.log('[PLUGIN] Folder plugins tidak ditemukan');
        return;
    }
    const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const pluginPath = path.join(PLUGINS_DIR, file);
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);
            if (plugin.alias && Array.isArray(plugin.alias)) {
                for (const alias of plugin.alias) {
                    plugins[alias.toLowerCase()] = plugin;
                }
            }
            console.log(`[PLUGIN] / ${file} -> ${plugin.alias ? plugin.alias.join(', ') : 'No Alias'}`);
        } catch (err) {
            console.error(`[PLUGIN] ${file}: ${err.message}`);
        }
    }
    console.log(`[PLUGIN] Total ${Object.keys(plugins).length} command loaded`);
}
loadPlugins();

// ===== MAIN HANDLER (ASYNC FUNCTION) =====
module.exports = async (sock, m) => {
    try {
        const msg = m.message || m;
        const text = msg.conversation
            || msg.extendedTextMessage?.text
            || msg.imageMessage?.caption
            || msg.videoMessage?.caption
            || '';

        if (!text || !text.startsWith(PREFIX)) return;

        const args = text.slice(PREFIX.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        const rawSender = m.key.participant || m.key.remoteJid;
        const senderNumber = cleanJid(rawSender);

        console.log(`[CMD] ${PREFIX}${command} | User ID: ${senderNumber}`);

        // ===== AUTO SAVE USER ID =====
        saveUserToDatabase(senderNumber);

        // ===== CEK BLACKLIST / CABUT AKSES (PREMIUM USER ID UI) =====
        try {
            const blacklistPath = path.join(__dirname, 'database', 'blacklist.json');
            if (fs.existsSync(blacklistPath)) {
                const blacklistedUsers = JSON.parse(fs.readFileSync(blacklistPath));
                const cleanSender = senderNumber.replace(/[^0-9]/g, '');
                
                if (blacklistedUsers.includes(cleanSender)) {
                    console.log(`[BLACKLIST] Akses ditolak untuk User ID: ${cleanSender}`);
                    
                    const now = new Date().toLocaleString('id-ID', { 
                        day: 'numeric', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                    });

                    const rejectMsg = `
╔══════════════════════════════════╗
║      🚫 *AKSES DIBLOKIR* 🚫      ║
══════════════════════════════════╝

⚠️ *SYSTEM SECURITY ALERT*

 *User ID:* \`${cleanSender}\`
📅 *Timestamp:* _${now}_
🔒 *Status:* **BLACKLISTED**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 *ACTION:* Command Access Revoked

Akun dengan User ID tersebut telah 
dicabut hak aksesnya secara permanen 
oleh *System Administrator*.

📩 Hubungi Owner jika ini adalah 
kesalahan sistem.

️ *Wabase-MD Security Protocol*
                    `.trim();

                    return await sock.sendMessage(m.key.remoteJid, { 
                        text: rejectMsg 
                    }, { quoted: m });
                }
            }
        } catch (e) {
            console.error('[BLACKLIST CHECK ERROR]', e.message);
        }

        // ===== WHITELIST CHECK (OPSIONAL) =====
        /*
        const WHITELIST_NUMBERS = [
            '3333988664344', '268921357783190', '265313763812141', 
            '26348441382730', '67040194896060', '6289976543210', '6288971091221'
        ];
        if (WHITELIST_NUMBERS.length > 0 && !WHITELIST_NUMBERS.includes(senderNumber)) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Akses ditolak. User ID tidak terdaftar di Whitelist.*'
            }, { quoted: m });
        }
        */

        // ===== PROCESS COMMAND VIA PLUGIN =====
        const plugin = plugins[command];

        if (!plugin) {
            console.log(`[CMD] ${PREFIX}${command} - TIDAK DITEMUKAN`);
            return await sock.sendMessage(m.key.remoteJid, {
                text: ` Command *${PREFIX}${command}* tidak ditemukan.\n\nKetik *${PREFIX}menu* untuk daftar command.`
            }, { quoted: m });
        }

        console.log(`[CMD] / ${PREFIX}${command} diproses oleh plugin`);

        await plugin.run({
            sock,
            m,
            prefix: PREFIX,
            args,
            command,
            senderNumber,
            text
        });

    } catch (err) {
        console.error('[HANDLER ERROR]', err);
        try {
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *System Error:* ${err.message}`
            }, { quoted: m });
        } catch (e) {
            console.error('[GAGAL KIRIM ERROR MSG]', e);
        }
    }
};
