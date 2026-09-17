module.exports = {
    name: 'ping',
    alias: ['ping', 'speed', 'latency'],
    desc: 'Cek kecepatan respon server bot.',
    category: 'general',
    run: async ({ sock, m, prefix, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const startTime = Date.now();
        
        // Kirim pesan dulu buat ngukur latency
        const sentMsg = await sock.sendMessage(chatId, { text: ' *Mengukur Kecepatan...*' }, { quoted: m });
        const endTime = Date.now();
        const latency = endTime - startTime;

        // Tentukan warna/status berdasarkan latency
        let statusEmoji = '🟢';
        let statusText = 'SANGAT CEPAT';
        if (latency > 500) { statusEmoji = '🟡'; statusText = 'NORMAL'; }
        if (latency > 1500) { statusEmoji = '🔴'; statusText = 'LAMBAT'; }

        const pingText = `
╔══════════════════════════════╗
║      ⚡ *SERVER SPEED*       ║
╚══════════════════════════════╝

 *Latency Test Result*

️ *Response Time:* \`${latency} ms\`
📶 *Server Status:* ${statusEmoji} *${statusText}*
🆔 *Request By:* \`${senderNumber}\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bot berjalan optimal di server 
*Vurx12 Premium Infrastructure*.

💎 *Powered by FORTXX © 2026*
        `.trim();

        // Edit pesan tadi jadi hasil ping yang mewah
        await sock.sendMessage(chatId, { text: pingText, edit: sentMsg.key });
    }
};
