const fs = require('fs');
const path = require('path');

const WHITELIST_NUMBERS = [
    '32303086604314',
    '268921357783190',
    '265313769812141',
    '26848461385780',
    '67040194896066',
    '6289876543210',
    '6288971091221',
];

const PREFIX = '.';
const PLUGINS_DIR = path.join(__dirname, 'plugins');

function cleanJid(jid) {
    if (!jid) return null;
    let clean = jid.replace(/[^0-9]/g, '');
    return clean.split('@')[0];
}

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
            const plugin = require(pluginPath);
            
            if (plugin.alias && Array.isArray(plugin.alias)) {
                for (const alias of plugin.alias) {
                    plugins[alias.toLowerCase()] = plugin;
                }
                console.log(`[PLUGIN] Loaded: ${file} -> ${plugin.alias.join(', ')}`);
            }
        } catch (err) {
            console.error(`[PLUGIN] Gagal load ${file}:`, err.message);
        }
    }
    
    console.log(`[PLUGIN] Total ${Object.keys(plugins).length} command`);
}

loadPlugins();

module.exports = async (sock, m) => {
    console.log('[HANDLER DEBUG 1] m keys:', Object.keys(m || {}));
    console.log('[HANDLER DEBUG 2] m.message keys:', m.message ? Object.keys(m.message) : 'null');
    
    const text = m.message?.conversation 
        || m.message?.extendedTextMessage?.text 
        || '';
    
    console.log('[HANDLER DEBUG 3] text:', JSON.stringify(text));
    
    if (!text.startsWith(PREFIX)) {
        console.log('[HANDLER DEBUG 4] Bukan command, skip');
        return;
    }
    
    const args = text.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    
    console.log('[HANDLER DEBUG 5] command:', command);
    
    const rawSender = m.key.participant || m.key.remoteJid;
    const senderNumber = cleanJid(rawSender);
    
    console.log('[HANDLER DEBUG 6] sender:', senderNumber);
    console.log('[ID] ID terdeteksi: ${senderNumber}');
    
    if (!WHITELIST_NUMBERS.includes(senderNumber)) {
        console.log('[DITOLAK] ${senderNumber} tidak ada di whitelist');
        return await sock.sendMessage(m.key.remoteJid, {
            text: '❌ Akses ditolak'
        }, { quoted: m });
    }
    
    const plugin = plugins[command];
    console.log('[HANDLER DEBUG 7] plugin found:', !!plugin);
    
    if (!plugin) {
        console.log('[CMD] ${PREFIX}${command} - TIDAK DITEMUKAN');
        return await sock.sendMessage(m.key.remoteJid, {
            text: 'Command tidak ditemukan'
        }, { quoted: m });
    }
    
    console.log('[CMD] ${PREFIX}${command} | ${senderNumber}');
    
    try {
        await plugin.run({ sock, m, prefix: PREFIX, args, command, senderNumber });
    } catch (err) {
        console.error('[ERROR] ${command}:', err.message);
        await sock.sendMessage(m.key.remoteJid, {
            text: '❌ Error: ' + err.message
        }, { quoted: m });
    }
};
