const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const SESSION_DIR = path.join(__dirname, '../sessions');
const BACKUP_DIR = path.join(__dirname, '../database/session_backup');
const HEALTH_LOG_PATH = path.join(__dirname, '../database/session_health.json');
const ASSET_LOG_PATH = path.join(__dirname, '../database/asset_logs.json');

const readJson = (p) => { try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : []; } catch { return []; } };
const writeJson = (p, d) => { const dir = path.dirname(p); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 2)); };
const getDirSize = (dir) => { let size = 0; if (fs.existsSync(dir)) { const files = fs.readdirSync(dir); for (const file of files) { const filePath = path.join(dir, file); const stat = fs.statSync(filePath); size += stat.isDirectory() ? getDirSize(filePath) : stat.size; } } return size; };
const formatBytes = (bytes) => bytes === 0 ? '0 B' : (bytes / (1024 * 1024)).toFixed(2) + ' MB';

module.exports = {
    name: 'asset',
    alias: ['take', 'clearsession', 'sessioninfo', 'healthcheck'],
    desc: 'Smart Asset Manager + Safe Session Cleanup + Health Monitor.',
    category: 'owner',
    isOwner: true,
    
    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const cmd = args[0]?.toLowerCase() || '';

        if (cmd === 'take') {
            if (!m.quoted || !m.quoted.stickerMessage) {
                return await sock.sendMessage(chatId, { text: `⚠️ *REPLY STICKER DULU*\n\nFormat: *${prefix}take Nama|Author*` }, { quoted: m });
            }

            const [name, author] = (args.slice(1).join(' ') || 'Vurx12 Premium|FORTXX').split('|');
            const stickerBuffer = await m.quoted.download();
            
            try {
                const image = await Jimp.read(stickerBuffer);
                await image.resize(512, 512, Jimp.RESIZE_BILINEAR);
                const optimizedBuffer = await image.getBufferAsync(Jimp.MIME_WEBP);

                await sock.sendMessage(chatId, { 
                    sticker: optimizedBuffer, 
                    packname: name.trim(), 
                    author: author.trim() 
                }, { quoted: m });

                const logs = readJson(ASSET_LOG_PATH);
                logs.push({ id: Date.now(), timestamp: new Date().toISOString(), action: 'take', operator: senderNumber, packname: name.trim() });
                writeJson(ASSET_LOG_PATH, logs);

            } catch (e) {
                await sock.sendMessage(chatId, { text: `❌ *GAGAL PROSES STICKER*\n\n${e.message}` }, { quoted: m });
            }
            return;
        }

        if (cmd === 'sessioninfo' || cmd === 'healthcheck') {
            const totalSize = getDirSize(SESSION_DIR);
            const files = fs.existsSync(SESSION_DIR) ? fs.readdirSync(SESSION_DIR) : [];
            const activeSessions = files.filter(f => f.endsWith('.json')).length;
            const healthLogs = readJson(HEALTH_LOG_PATH);
            const recentAnomalies = healthLogs.filter(l => Date.now() - new Date(l.timestamp).getTime() < 3600000 && l.type === 'anomaly');
            const anomalyStatus = recentAnomalies.length > 0 ? '🔴 ANOMALI TERDETEKSI' : '✅ NORMAL';

            const infoText = `╔══════════════════════════════╗
║      💾 *SESSION ANALYTICS*    ║
╚══════════════════════════════╝

📊 *Status Penyimpanan:*
✔️ Total Sesi Aktif: ${activeSessions} File
📦 Ukuran Total: ${formatBytes(totalSize)}
🛡️ Kesehatan Sistem: ${anomalyStatus}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Jika ukuran > 500MB, jalankan *${prefix}clearsession smart*

💎 *Vurx12 Premium Asset Manager*`.trim();

            await sock.sendMessage(chatId, { text: infoText }, { quoted: m });
            return;
        }

        if (cmd === 'clearsession') {
            const mode = args[1]?.toLowerCase() || 'smart';
            
            if (!fs.existsSync(SESSION_DIR)) {
                return await sock.sendMessage(chatId, { text: `ℹ️ *FOLDER SESI KOSONG*` }, { quoted: m });
            }

            const backupTimestamp = Date.now();
            const backupPath = path.join(BACKUP_DIR, `backup_${backupTimestamp}`);
            fs.mkdirSync(backupPath, { recursive: true });
            
            const allFiles = fs.readdirSync(SESSION_DIR);
            for (const file of allFiles) {
                fs.copyFileSync(path.join(SESSION_DIR, file), path.join(backupPath, file));
            }

            let deletedCount = 0;
            let savedSpace = 0;

            if (mode === 'smart') {
                const now = Date.now();
                for (const file of allFiles) {
                    const filePath = path.join(SESSION_DIR, file);
                    const stat = fs.statSync(filePath);
                    const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);
                    if (ageHours > 168 || stat.size < 1024) {
                        savedSpace += stat.size;
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                }
            } else {
                for (const file of allFiles) {
                    const filePath = path.join(SESSION_DIR, file);
                    const stat = fs.statSync(filePath);
                    savedSpace += stat.size;
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }

            const healthLogs = readJson(HEALTH_LOG_PATH);
            healthLogs.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                type: 'cleanup',
                mode,
                deleted: deletedCount,
                spaceSaved: savedSpace,
                backupPath,
                operator: senderNumber
            });
            writeJson(HEALTH_LOG_PATH, healthLogs);

            const reportText = `╔══════════════════════════════╗
║   ✅ *CLEANUP SELESAI!*        
╚══════════════════════════════╝

🧹 *Mode:* ${mode.toUpperCase()} CLEANUP
🗑️ File Dihapus: ${deletedCount}
💾 Ruang Hemat: ${formatBytes(savedSpace)}
💿 Backup: \`database/session_backup/backup_${backupTimestamp}\`

 Backup auto-hapus setelah 7 hari.

 *Vurx12 Premium Safe Cleanup*`.trim();

            await sock.sendMessage(chatId, { text: reportText }, { quoted: m });
            return;
        }

        await sock.sendMessage(chatId, { 
            text: `⚠️ *COMMAND TIDAK DIKENAL*\n\nGunakan:\n• *${prefix}take Nama|Author*\n• *${prefix}sessioninfo*\n• *${prefix}clearsession smart*\n• *${prefix}clearsession full*` 
        }, { quoted: m });
    }
};
