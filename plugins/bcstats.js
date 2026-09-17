const fs = require('fs');
const path = require('path');

const LOGS_PATH = path.join(__dirname, '../database', 'bc_logs.json');

module.exports = {
    name: 'bcstats',
    alias: ['bcstats', 'broadcaststats', 'logbc'],
    desc: 'Melihat riwayat analitik broadcast.',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m, senderNumber }) => {
        const chatId = m.key.remoteJid;
        
        try {
            if (!fs.existsSync(LOGS_PATH)) {
                return await sock.sendMessage(chatId, { text: `📭 *BELUM ADA DATA*\n\nBelum pernah melakukan broadcast sejak sistem analytics diaktifkan.` }, { quoted: m });
            }

            const logs = JSON.parse(fs.readFileSync(LOGS_PATH));
            if (logs.length === 0) {
                return await sock.sendMessage(chatId, { text: `📭 *LOG KOSONG*\n\nRiwayat broadcast masih kosong.` }, { quoted: m });
            }

            // Ambil 5 sesi terakhir
            const recentLogs = logs.slice(-5).reverse();
            
            let statsText = `╔══════════════════════════════╗
║      📊 *BC ANALYTICS*         ║
══════════════════════════════╝

🗂️ *5 Sesi Broadcast Terakhir:*\n\n`;

            recentLogs.forEach((log, i) => {
                const date = new Date(log.timestamp).toLocaleString('id-ID');
                const statusEmoji = log.fail === 0 ? '🟢' : log.fail < 5 ? '🟡' : '🔴';
                
                statsText += `${i + 1}. ${statusEmoji} *${log.type.toUpperCase()} BROADCAST*\n`;
                statsText += `    ${date}\n`;
                statsText += `   ✔️ ${log.success} | ❌ ${log.fail} | ⏱️ ${log.durationSec}s\n`;
                statsText += `    Op: \`${log.operator}\`\n\n`;
            });

            statsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Sesi Tersimpan: ${logs.length}
💎 *Vurx12 Premium Analytics*`.trim();

            await sock.sendMessage(chatId, { text: statsText }, { quoted: m });

        } catch (e) {
            console.error('[BCSTATS] Error:', e.message);
            await sock.sendMessage(chatId, { text: `⚠️ *ERROR MEMBACA LOG*\n\nTerjadi kesalahan saat membaca file analitik.` }, { quoted: m });
        }
    }
};
