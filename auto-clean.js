const fs = require('fs');
const path = require('path');

const CLEAN_INTERVAL = 24 * 60 * 60 * 1000; // 24 jam

function getSize(dir) {
    let size = 0;
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile()) size += stat.size;
                else if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
                    size += getSize(fullPath);
                }
            } catch (e) {}
        }
    } catch (e) {}
    return size;
}

function cleanDir(dirPath, extensions) {
    if (!fs.existsSync(dirPath)) return { count: 0, size: 0 };
    let count = 0, size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile()) {
                    const shouldDelete = extensions.some(ext => file.endsWith(ext));
                    if (shouldDelete) {
                        size += stat.size;
                        fs.unlinkSync(fullPath);
                        count++;
                    }
                } else if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
                    const sub = cleanDir(fullPath, extensions);
                    count += sub.count;
                    size += sub.size;
                }
            } catch (e) {}
        }
    } catch (e) {}
    return { count, size };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function runAutoClean() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   🧹 AUTO CLEAN - DIBERSIHKAN            ║');
    console.log('╚══════════════════════════════════════════╝');
    
    const baseDir = path.join(__dirname);
    let totalFreed = 0;
    let totalFiles = 0;

    const tempResult = cleanDir(path.join(baseDir, 'temp'), ['.mp4', '.mp3', '.png', '.jpg', '.webp', '.tmp', '.webm', '.m4a']);
    console.log(`📁 Temp: ${tempResult.count} file (${formatBytes(tempResult.size)})`);
    totalFreed += tempResult.size;
    totalFiles += tempResult.count;

    const logResult = cleanDir(path.join(baseDir, 'logs'), ['.log', '.log.gz', '.log.1']);
    console.log(`📋 Logs: ${logResult.count} file (${formatBytes(logResult.size)})`);
    totalFreed += logResult.size;
    totalFiles += logResult.count;

    const pm2Dir = path.join(process.env.HOME || '/data/data/com.termux/files/home', '.pm2');
    const pm2Result = cleanDir(pm2Dir, ['.log', '.pid']);
    console.log(`⚙️  PM2: ${pm2Result.count} file (${formatBytes(pm2Result.size)})`);
    totalFreed += pm2Result.size;
    totalFiles += pm2Result.count;

    console.log(`\n✅ Total: ${totalFiles} file dihapus, ${formatBytes(totalFreed)} dibebaskan\n`);
}

console.log(`[AUTO-CLEAN] 🕐 Auto clean aktif, berjalan setiap 24 jam`);
console.log(`[AUTO-CLEAN] 📊 Ukuran cache saat ini: ${formatBytes(getSize(path.join(__dirname, 'temp')) + getSize(path.join(__dirname, 'logs')))}`);

setTimeout(runAutoClean, 5 * 60 * 1000);
setInterval(runAutoClean, CLEAN_INTERVAL);

