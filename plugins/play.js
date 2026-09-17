const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    alias: ['play', 'ytmp3', 'music'],
    requiredLevel: 0,
    
    run: async ({ sock, m, prefix, args }) => {
        const query = args.join(' ');
        
        if (!query) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *ERROR*\n\nMasukkan judul lagu!\n\nContoh: *${prefix}play Laskar Pelangi*` 
            }, { quoted: m });
        }

        // 1. KIRIM STATUS PROSES
        await sock.sendMessage(m.key.remoteJid, { 
            text: `⏳ *Sedang mencari dan mendownload: ${query}...*` 
        }, { quoted: m });

        const filename = `music_${Date.now()}.mp3`;
        const filepath = `/sdcard/Download/${filename}`;
        
        // 2. COMMAND YT-DLP (Cari judul + Download Audio Terbaik)
        // --extract-audio: convert ke audio
        // --audio-format mp3: format output
        // -o: lokasi simpan
        const command = `yt-dlp -x --audio-format mp3 -o "${filepath}" "ytsearch:${query}" 2>&1`;

        console.log(`[Play] Executing: ${command}`);

        exec(command, { timeout: 120000 }, async (error, stdout, stderr) => {
            try {
                const output = stdout + stderr;
                console.log(`[Play] Output: ${output.substring(0, 200)}`);

                // CEK APAKAH FILE BERHASIL DIDOWNLOAD (>100KB)
                if (fs.existsSync(filepath) && fs.statSync(filepath).size > 100000) {
                    
                    // Ambil judul dari output yt-dlp biar captionnya rapi
                    let title = query;
                    const match = output.match(/$$download$$ Destination: (.*)/);
                    if (match) title = path.basename(match[1], '.mp3');

                    await sock.sendMessage(m.key.remoteJid, { 
                        audio: fs.readFileSync(filepath),
                        mimetype: 'audio/mpeg',
                        ptt: false, // false = kirim sebagai file musik, true = kirim sebagai voice note
                        caption: `🎵 *MUSIC PLAYER*\n\nJudul: ${title}\n_Download by ${prefix}play_`
                    }, { quoted: m });
                    
                    fs.unlinkSync(filepath); // Hapus file setelah dikirim
                    console.log('[Play] ✅ Success & deleted');
                } else {
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: `❌ *GAGAL DOWNLOAD*\n\nLagu tidak ditemukan atau error server.\n\nCoba judul lain.` 
                    }, { quoted: m });
                    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                }
            } catch (e) {
                console.error('[Play] Callback Error:', e);
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *CRASH SAAT KIRIM AUDIO*\n\n${e.message}` 
                }, { quoted: m }).catch(() => {});
            }
        });
    }
};

