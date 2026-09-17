
module.exports = (sock) => {
    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer') {
                console.log('[ANTI-CALL] Memblokir:', call.from);
                try {
                    await sock.sendMessage(call.from, { text: '🚫 *AUTO BLOCK!*\nBot ini tidak menerima panggilan. Nomor Anda diblokir otomatis.' });
                    await sock.updateBlockStatus(call.from, 'block');
                } catch(e) {}
            }
        }
    });
};
