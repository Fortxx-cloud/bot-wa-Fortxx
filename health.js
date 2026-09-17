
module.exports = async (m) => {
    if (m.body === '.health' || m.body === '.status') {
        const os = require('os');
        const uptime = process.uptime();
        const jam = Math.floor(uptime / 3600);
        const menit = Math.floor((uptime % 3600) / 60);
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
        return m.reply(` *BOT HEALTH STATUS*\n\n️ *Uptime:* ${jam} Jam ${menit} Menit\n🧠 *RAM:* ${ram} MB / ${totalRam} MB`);
    }
};
