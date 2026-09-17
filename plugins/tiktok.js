const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['tiktok', 'tt', 'tiktokdl', 'ttdl'],
    requiredLevel: 0,
    
    run: async ({ sock, m, prefix, args }) => {
        try {
            let url = args[0];
            if (!url && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                url = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
            }

            if (!url || !url.includes('tiktok.com')) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *ERROR*\n\nKirim atau reply link TikTok!\n\nContoh: *${prefix}tiktok https://vt.tiktok.com/xxxxx*` 
                }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { 
                text: ' *Membersihkan & memproses link...*' 
            }, { quoted: m });

            // 1. URL CLEANER: Buang semua parameter sampah
            let cleanUrl = url.split('?')[0].split('#')[0]; 
            
            // 2. SMART RESOLVE: Kalau short link, resolve jadi full URL dulu
            if (cleanUrl.includes('vt.tiktok.com') || cleanUrl.includes('vm.tiktok.com')) {
                try {
                    const res = await axios.get(cleanUrl, { 
                        maxRedirects: 0, 
                        validateStatus: () => true,
                        timeout: 10000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const loc = res.headers.location;
                    if (loc && loc.includes('/video/')) {
                        cleanUrl = loc.split('?')[0]; // Bersihkan lagi hasil redirect
                        console.log(`[TT] Resolved & Cleaned: ${url} -> ${cleanUrl}`);
                    }
                } catch (e) {
                    console.log('[TT] Gagal resolve, pakai URL bersih:', e.message);
                }
            } else {
                console.log(`[TT] URL Dibersihkan: ${url} -> ${cleanUrl}`);
            }

            // 3. DOWNLOAD VIA CLI DENGAN URL BERSIH
            const filename = `tiktok_${Date.now()}.mp4`;
            const filepath = path.join('/sdcard/Download', filename);

            const services = ['--tikwm', '--tiktok', '--ttdownloader'];
            let success = false;

            for (const service of services) {
                if (success) break;
                
                console.log(`[TT] Trying ${service} with clean URL`);
                const command = `python -m tiktok_downloader ${service} --url "${cleanUrl}" --save "${filepath}" 2>&1`;
                
                await new Promise((resolve) => {
                    exec(command, { timeout: 60000 }, async (error, stdout, stderr) => {
                        const output = (stdout + stderr).toLowerCase();
                        
                        if (!error && fs.existsSync(filepath) && fs.statSync(filepath).size > 50000) {
                            console.log(`[TT] ✅ Success via ${service}`);
                            success = true;
                            
                            await sock.sendMessage(m.key.remoteJid, { 
                                video: fs.readFileSync(filepath),
                                caption: `✅ *TIKTOK DOWNLOADER*\n\n_Download by ${prefix}tiktok_\n_Service: ${service.replace('--', '')}_`
                            }, { quoted: m });

                            fs.unlinkSync(filepath);
                        } else if (output.includes('not found') || output.includes('failed')) {
                            console.log(`[TT] ❌ ${service} failed`);
                            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                        }
                        resolve();
                    });
                });
            }

            if (!success) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *GAGAL DOWNLOAD*\n\nLink mungkin private atau diblokir TikTok.\n\nCoba kirim ulang link atau gunakan link lain.` 
                }, { quoted: m });
            }

        } catch (e) {
            console.error(' Error tiktok:', e.message);
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *SERVER ERROR*\n\n${e.message}` 
            }, { quoted: m });
        }
    }
};

