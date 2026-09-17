const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    alias: ['setid', 'addadmin', 'tambahlevel'],
    requiredLevel: 2, // HANYA OWNER LEVEL 2 YANG BISA PAKAI
    
    run: async ({ sock, m, prefix, args }) => {
        const targetNumber = args[0]?.replace(/[^0-9]/g, '');
        
        // VALIDASI INPUT
        if (!targetNumber || targetNumber.length < 10) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: ` *Format Salah!*\n\nGunakan:\n*${prefix}setid 628xxxxxxxxxx*\n\nContoh:\n*${prefix}setid 6281234567890*` 
            }, { quoted: m });
        }

        // CEK APAKAH SUDAH ADA DI DAFTAR ADMIN/OWNER
        const currentList = Array.isArray(config.admins) 
            ? config.admins.map(n => String(n).replace(/[^0-9]/g, ''))
            : [];
            
        // Cek juga di ownerNumber biar gak dobel
        const owners = Array.isArray(config.ownerNumber) 
            ? config.ownerNumber.map(n => String(n).replace(/[^0-9]/g, ''))
            : [String(config.ownerNumber).replace(/[^0-9]/g, '')];

        if (currentList.includes(targetNumber) || owners.includes(targetNumber)) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `⚠️ *Nomor ${targetNumber} sudah terdaftar!*` 
            }, { quoted: m });
        }

        try {
            // TAMBAHKAN KE CONFIG.JS SEBAGAI ADMIN (LEVEL 1)
            const configPath = path.join(__dirname, '..', 'config.js');
            let configContent = fs.readFileSync(configPath, 'utf8');
            
            // Pastikan array admins ada di config.js, kalau belum bikin baru
            if (!configContent.includes('admins:')) {
                configContent = configContent.replace(
                    /module\.exports\s*=\s*{/,
                    "module.exports = {\n  admins: [],"
                );
            }

            // Tambahkan nomor ke array admins
            const newAdminArray = [...currentList, targetNumber];
            const newConfigLine = `admins: ${JSON.stringify(newAdminArray)},`;
            
            // Regex untuk mencari dan mengganti baris admins
            const regex = /admins\s*:\s*$$.*?$$/;
            if (regex.test(configContent)) {
                configContent = configContent.replace(regex, newConfigLine);
            } else {
                // Fallback jika regex gagal, tambahkan manual setelah module.exports
                configContent = configContent.replace(
                    /module\.exports\s*=\s*{/,
                    `module.exports = {\n  ${newConfigLine}`
                );
            }
            
            fs.writeFileSync(configPath, configContent, 'utf8');
            
            // UPDATE GLOBAL VARIABLE AGAR LANGSUNG EFEKTIF
            config.admins = newAdminArray;
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ *Berhasil Ditambahkan sebagai ADMIN!*\n\n📱 *Nomor:* +${targetNumber}\n🔐 *Level:* 1 (Admin Grup/Terbatas)\n⚡ *Efek:* Langsung aktif tanpa restart!\n\n️ *Catatan:* Dia BELUM bisa akses command Owner Level 2.` 
            }, { quoted: m });
            
            console.log(`[SETID] Admin baru ditambahkan: ${targetNumber} (Level 1)`);
            
        } catch (e) {
            console.error('[SETID] Error:', e);
            await sock.sendMessage(m.key.remoteJid, { 
                text: '❌ *Gagal menambahkan!* Pastikan file config.js writable.' 
            }, { quoted: m });
        }
    }
};

