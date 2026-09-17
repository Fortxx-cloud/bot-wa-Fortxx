const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['status', 'botinfo', 'info', 'runtime'],
    requiredLevel: 0, // Bisa diakses semua orang
    
    run: async ({ sock, m, prefix }) => {
        try {
            // 1. Hitung Uptime (Runtime)
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const runtimeText = `${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik`;

            // 2. Hitung Ping (Latency)
            const ping = Date.now() - (m.messageTimestamp * 1000);

            // 3. Info Sistem (RAM & OS)
            const ramTotal = (os.totalmem() / 1024 / 1024).toFixed(2);
            const ramUsed = (ramTotal - (os.freemem() / 1024 / 1024)).toFixed(2);
            const platform = os.platform();
            const hostname = os.hostname();

            // 4. Hitung Jumlah Plugin
            const pluginsDir = path.join(__dirname);
            const totalPlugins = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js')).length;

            // 5. Format Pesan (Tampilan Keren)
            const text = `
╭───『 *🤖 BOT STATUS* 』───❒
│ 
│ 👑 *Owner:* 268921357783190
│  *Ping:* ${ping} ms
│ ️ *Runtime:* ${runtimeText}
│ 
╰────────────────────❒

╭───『 *📊 SYSTEM INFO* 』───❒
│ 🖥️ *OS:* ${platform} (${hostname})
│ 💾 *RAM:* ${ramUsed} MB / ${ramTotal} MB
│ 📦 *Plugins:* ${totalPlugins} Active
│ 🟢 *Status:* Online & Stable
╰────────────────────❒

> _Powered by Baileys & Node.js_
`.trim();

            await sock.sendMessage(m.key.remoteJid, { 
                text: text 
            }, { quoted: m });

        } catch (e) {
            console.error('❌ Error di status.js:', e.message);
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Gagal memuat status: ${e.message}` 
            }, { quoted: m });
        }
    }
};

