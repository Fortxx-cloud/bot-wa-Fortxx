const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    alias: ['tts', 'texttospeech', 'suaraku', 'voicenote', 'speak'],
    requiredLevel: 0,
    run: async ({ sock, m, prefix, args, text, body }) => {
        try {
            let inputText = text || args.join(' ');
            
            // Fix parsing: hapus prefix + command dari text
            if (inputText) {
                const prefixRegex = new RegExp(`^\\${prefix || '.'}(tts|texttospeech|suaraku|voicenote|speak)\\s*`, 'i');
                inputText = inputText.replace(prefixRegex, '').trim();
            }
            
            // Fallback: ambil dari body message
            if (!inputText && body) {
                const bodyRegex = new RegExp(`^\\${prefix || '.'}(tts|texttospeech|suaraku|voicenote|speak)\\s+(.+)$`, 'i');
                const match = body.match(bodyRegex);
                if (match) inputText = match[2].trim();
            }
            
            // Ambil dari quoted message kalau user reply pesan
            if (!inputText && m.quoted && m.quoted.text) {
                inputText = m.quoted.text;
            }
            
            if (!inputText) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: ` *Text to Speech (Google-like Voice)*\n\nCara pakai:\n• *${prefix}tts Halo bang*\n• Reply pesan + *${prefix}tts*\n\nVoice: Gadis (Cewek) 🇮🇩\nEngine: Edge TTS (Gratis, Tanpa API)`
                }, { quoted: m });
            }
            
            if (inputText.length > 500) {
                return await sock.sendMessage(m.key.remoteJid, {
                    text: '❌ Teks terlalu panjang! Maksimal 500 karakter.'
                }, { quoted: m });
            }
            
            await sock.sendMessage(m.key.remoteJid, {
                text: '🔊 Sedang generate suara AI...'
            }, { quoted: m });
            
            const botRoot = path.resolve(__dirname, '..');
            const tempDir = path.join(botRoot, 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const timestamp = Date.now();
            const mp3File = path.join(tempDir, `tts_${timestamp}.mp3`);
            const oggFile = path.join(tempDir, `tts_${timestamp}.ogg`);
            
            const safeText = inputText.replace(/"/g, '\\"').replace(/`/g, '').replace(/\n/g, ' ').trim();
            
            console.log(`[TTS] Generating audio for: "${safeText}"`);
            
            // 1. Generate MP3 pakai edge-tts (Voice: GadisNeural - cewek Indonesia)
            const edgeCmd = `edge-tts --voice "id-ID-GadisNeural" --text "${safeText}" --write-media "${mp3File}" 2>&1`;
            
            exec(edgeCmd, { timeout: 60000 }, async (error, stdout, stderr) => {
                if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 100) {
                    console.error('[TTS] edge-tts error:', stderr);
                    return await sock.sendMessage(m.key.remoteJid, {
                        text: '❌ Gagal generate suara.\n\nPastikan internet aktif dan edge-tts terinstall:\n`pip install edge-tts`'
                    }, { quoted: m });
                }
                
                console.log(`[TTS] MP3 generated: ${fs.statSync(mp3File).size} bytes`);
                
                // 2. Convert MP3 → OGG Opus (format voice note WhatsApp)
                const oggCmd = `ffmpeg -y -i "${mp3File}" -c:a libopus -b:a 32k -vbr on -application voip "${oggFile}" 2>&1`;
                
                exec(oggCmd, { timeout: 30000 }, async (err2, stdout2, stderr2) => {
                    if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File);
                    
                    let fileToSend;
                    let mimetype;
                    
                    if (fs.existsSync(oggFile) && fs.statSync(oggFile).size > 100) {
                        fileToSend = oggFile;
                        mimetype = 'audio/ogg; codecs=opus';
                        console.log('[TTS] Menggunakan OGG Opus');
                    } else {
                        fileToSend = mp3File;
                        mimetype = 'audio/mpeg';
                        console.log('[TTS] Fallback ke MP3');
                    }
                    
                    await sock.sendMessage(m.key.remoteJid, {
                        audio: fs.readFileSync(fileToSend),
                        mimetype: mimetype,
                        ptt: true
                    }, { quoted: m });
                    
                    if (fs.existsSync(oggFile)) fs.unlinkSync(oggFile);
                    if (fs.existsSync(mp3File)) fs.unlinkSync(mp3File);
                    
                    console.log(`[TTS] ✓ Berhasil generate (${inputText.length} char)`);
                });
            });
            
        } catch (err) {
            console.error('[TTS ERROR]', err);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ Error: ${err.message}`
            }, { quoted: m });
        }
    }
};
