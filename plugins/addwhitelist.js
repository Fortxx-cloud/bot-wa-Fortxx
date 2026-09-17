const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addwhitelist',
    alias: ['addwl', 'tambahwhitelist'],
    desc: 'Menambahkan User ID ke Whitelist handler.js secara live',
    category: 'owner',
    isOwner: true,

    run: async ({ sock, m, prefix, args }) => {
        const chatId = m.key.remoteJid;
        const targetId = args[0];

        if (!targetId || isNaN(targetId)) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Format Salah*\n\nGunakan: *${prefix}addwl 628123456789*\n(Hanya masukkan angka nomor HP)` 
            }, { quoted: m });
        }

        const handlerPath = path.join(__dirname, '../handler.js');
        
        try {
            let content = fs.readFileSync(handlerPath, 'utf-8');
            
            // Cek apakah ID sudah ada
            if (content.includes(`'${targetId}'`) || content.includes(`"${targetId}"`)) {
                return await sock.sendMessage(chatId, { 
                    text: `⚠️ *User ${targetId} sudah terdaftar di Whitelist!*` 
                }, { quoted: m });
            }

            // Regex pintar untuk mencari array WHITELIST_NUMBERS dan menyisipkan ID baru
            // Mencari pola: const WHITELIST_NUMBERS = [ ... ];
            const regex = /(const\s+WHITELIST_NUMBERS\s*=\s*$$[\s\S]*?)($$;)/;
            const match = content.match(regex);

            if (match) {
                // Sisipkan ID baru sebelum kurung siku tutup
                const newEntry = `\n            '${targetId}',`;
                const updatedContent = content.replace(regex, `$1${newEntry}$2`);
                
                fs.writeFileSync(handlerPath, updatedContent);
                
                // Force reload module handler agar perubahan langsung terasa
                delete require.cache[require.resolve(handlerPath)];
                
                return await sock.sendMessage(chatId, { 
                    text: `✅ *Whitelist Berhasil Diupdate!*\n\nID \`${targetId}\` telah ditambahkan ke handler.js.\nPerubahan aktif secara realtime tanpa restart.` 
                }, { quoted: m });
            } else {
                return await sock.sendMessage(chatId, { 
                    text: `❌ *Gagal Menemukan Array Whitelist*\nPastikan variabel const WHITELIST_NUMBERS ada di handler.js` 
                }, { quoted: m });
            }

        } catch (e) {
            console.error('[ADD WL ERROR]', e);
            return await sock.sendMessage(chatId, { 
                text: `❌ *System Error:* ${e.message}` 
            }, { quoted: m });
        }
    }
};
