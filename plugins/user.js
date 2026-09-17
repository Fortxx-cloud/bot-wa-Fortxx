const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    alias: ['user', 'manage', 'whitelist'],
    requiredLevel: 2, // HANYA OWNER LEVEL 2
    
    run: async ({ sock, m, prefix, args }) => {
        const subCmd = args[0]?.toLowerCase();
        const targetNumber = args[1]?.replace(/[^0-9]/g, '');
        
        // Helper: Normalisasi array config
        const getCleanArray = (arr) => Array.isArray(arr) 
            ? arr.map(n => String(n).replace(/[^0-9]/g, ''))
            : [];
            
        const owners = getCleanArray(config.ownerNumber);
        const admins = getCleanArray(config.admins || []);
        
        // Helper: Update config.js secara dinamis
        const updateConfigFile = (key, newArray) => {
            const configPath = path.join(__dirname, '..', 'config.js');
            let content = fs.readFileSync(configPath, 'utf8');
            const regex = new RegExp(`${key}\\s*:\\s*\$$.*?\$$`);
            const replacement = `${key}: ${JSON.stringify(newArray)},`;
            
            if (regex.test(content)) {
                content = content.replace(regex, replacement);
            } else {
                content = content.replace(/module\.exports\s*=\s*{/, `module.exports = {\n  ${replacement}`);
            }
            fs.writeFileSync(configPath, content, 'utf8');
        };

        // ==========================================
        // SUB-COMMAND: .user add <nomor>
        // Menambahkan user sebagai Admin (Level 1)
        // ==========================================
        if (subCmd === 'add') {
            if (!targetNumber || targetNumber.length < 10) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *Format Salah!*\n\nGunakan:\n*${prefix}user add 628xxxxxxxxxx*` 
                }, { quoted: m });
            }
            
            if (owners.includes(targetNumber) || admins.includes(targetNumber)) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `⚠️ Nomor +${targetNumber} sudah terdaftar!` 
                }, { quoted: m });
            }

            try {
                const newAdmins = [...admins, targetNumber];
                updateConfigFile('admins', newAdmins);
                config.admins = newAdmins; // Update global var
                
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `✅ *USER DITAMBAHKAN*\n\n📱 *Nomor:* +${targetNumber}\n🔐 *Level:* 1 (Admin)\n⚡ *Status:* Langsung aktif tanpa restart!` 
                }, { quoted: m });
            } catch (e) {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal menyimpan ke config.js' }, { quoted: m });
            }
        }

        // ==========================================
        // SUB-COMMAND: .user upgrade <nomor>
        // Menaikkan Admin (Lvl 1) ke Owner (Lvl 2)
        // ==========================================
        else if (subCmd === 'upgrade') {
            if (!targetNumber || targetNumber.length < 10) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *Format Salah!*\n\nGunakan:\n*${prefix}user upgrade 628xxxxxxxxxx*` 
                }, { quoted: m });
            }
            
            if (owners.includes(targetNumber)) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `⚠️ Nomor +${targetNumber} sudah menjadi OWNER!` 
                }, { quoted: m });
            }
            
            if (!admins.includes(targetNumber)) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *Gagal Upgrade!*\n\nNomor +${targetNumber} belum jadi Admin.\nGunakan *${prefix}user add ${targetNumber}* dulu.` 
                }, { quoted: m });
            }

            try {
                const newAdmins = admins.filter(n => n !== targetNumber);
                const newOwners = [...owners, targetNumber];
                
                updateConfigFile('admins', newAdmins);
                updateConfigFile('ownerNumber', newOwners);
                
                config.admins = newAdmins;
                config.ownerNumber = newOwners;
                
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `👑 *UPGRADE BERHASIL!*\n\n📱 *Nomor:* +${targetNumber}\n🔼 *Level:* 1  2 (OWNER FULL)\n *Status:* Akses penuh langsung aktif!\n⚠️ *Warning:* User ini sekarang bisa kontrol seluruh bot.` 
                }, { quoted: m });
            } catch (e) {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ Gagal meng-upgrade user' }, { quoted: m });
            }
        }

        // ==========================================
        // SUB-COMMAND: .user list
        // Melihat daftar semua user terdaftar
        // ==========================================
        else if (subCmd === 'list') {
            let reply = `📋 *DAFTAR USER TERDAFTAR*\n\n`;
            
            reply += `👑 *OWNER (Level 2)*\n`;
            if (owners.length > 0) {
                owners.forEach((num, i) => reply += `   ${i+1}. +${num}\n`);
            } else {
                reply += `   *(Kosong)*\n`;
            }
            
            reply += `\n🛡️ *ADMIN (Level 1)*\n`;
            if (admins.length > 0) {
                admins.forEach((num, i) => reply += `   ${i+1}. +${num}\n`);
            } else {
                reply += `   *(Kosong)*\n`;
            }
            
            reply += `\n *Total:* ${owners.length} Owner | ${admins.length} Admin`;
            
            await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
        }

        // ==========================================
        // HELP MENU JIKA SUB-COMMAND SALAH/KOSONG
        // ==========================================
        else {
            await sock.sendMessage(m.key.remoteJid, { 
                text: `️ *SMART USER MANAGER*\n\nGunakan sub-command berikut:\n\n• *${prefix}user add <nomor>*\n  └ Tambah user sbg Admin (Lvl 1)\n\n• *${prefix}user upgrade <nomor>*\n  └ Naikkan Admin ke Owner (Lvl 2)\n\n• *${prefix}user list*\n   Lihat semua user terdaftar\n\nContoh:\n*${prefix}user add 6281234567890*` 
            }, { quoted: m });
        }
    }
};

