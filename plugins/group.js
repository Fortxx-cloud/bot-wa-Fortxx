const fs = require('fs');
const path = require('path');

// Path Database Group Analytics & Whitelist
const GROUP_LOGS_PATH = path.join(__dirname, '../database', 'group_logs.json');
const GROUP_WHITELIST_PATH = path.join(__dirname, '../database', 'group_whitelist.json');

// Helper: Baca/Tulis JSON Aman
const readJson = (p) => {
    try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : []; } 
    catch { return []; }
};
const writeJson = (p, d) => {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

module.exports = {
    name: 'group',
    alias: ['join', 'leave', 'grouplist', 'groupstats'],
    desc: 'Manajemen grup premium + Graceful Leave + Analytics.',
    category: 'owner',
    isOwner: true,
    
    run: async ({ sock, m, prefix, args, senderNumber }) => {
        const chatId = m.key.remoteJid;
        const cmd = args[0]?.toLowerCase() || '';

        // === JOIN GRUP DENGAN VALIDASI ANTI-SPAM ===
        if (cmd === 'join' || !args.length && m.text.includes('chat.whatsapp.com')) {
            const link = args[1] || m.text.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{20,})/)?.[0];
            
            if (!link) {
                return await sock.sendMessage(chatId, { 
                    text: `⚠️ *LINK TIDAK VALID*\n\nFormat: *${prefix}join https://chat.whatsapp.com/XXXXX*\nAtau reply pesan berisi link invite.` 
                }, { quoted: m });
            }

            // Validasi Anti-Spam Link
            const whitelist = readJson(GROUP_WHITELIST_PATH);
            const logs = readJson(GROUP_LOGS_PATH);
            const recentJoins = logs.filter(l => l.action === 'join' && Date.now() - new Date(l.timestamp).getTime() < 300000);
            
            if (recentJoins.length >= 5) {
                return await sock.sendMessage(chatId, { text: `️ *RATE LIMIT*\n\nMaksimal 5 join per 5 menit. Tunggu sebentar.` }, { quoted: m });
            }

            try {
                const code = link.split('/').pop();
                const groupInfo = await sock.groupGetInviteInfo(code);
                
                // Cek apakah grup sudah pernah di-blacklist/dileave permanen
                const blacklisted = logs.some(l => l.gid === groupInfo.id && l.reason === 'blacklisted');
                if (blacklisted && !whitelist.includes(groupInfo.id)) {
                    return await sock.sendMessage(chatId, { text: `🚫 *GRUP DIBLOKIR*\n\nGrup ini pernah ditandai sebagai spam/blacklist. Gunakan *${prefix}whitelist [gid]* untuk override.` }, { quoted: m });
                }

                await sock.groupAcceptInvite(code);
                
                // Catat Log Join
                logs.push({
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    action: 'join',
                    gid: groupInfo.id,
                    gname: groupInfo.subject,
                    members: groupInfo.size,
                    operator: senderNumber
                });
                writeJson(GROUP_LOGS_PATH, logs);

                await sock.sendMessage(chatId, { 
                    text: `✅ *BERHASIL MASUK GRUP*\n\nNama: ${groupInfo.subject}\nMember: ${groupInfo.size}\nGID: \`${groupInfo.id}\`` 
                }, { quoted: m });

            } catch (e) {
                await sock.sendMessage(chatId, { text: ` *GAGAL JOIN*\n\n${e.message}` }, { quoted: m });
            }
            return;
        }

        // === GRACEFUL LEAVE DENGAN NOTIFIKASI ===
        if (cmd === 'leave') {
            const targetGid = chatId;
            const whitelist = readJson(GROUP_WHITELIST_PATH);
            
            // Cek Whitelist VIP
            if (whitelist.includes(targetGid)) {
                return await sock.sendMessage(chatId, { 
                    text: `🔒 *VIP PROTECTED*\n\nGrup ini ada di whitelist. Gunakan *${prefix}unwhitelist* dulu jika ingin keluar.` 
                }, { quoted: m });
            }

            // Kirim Pesan Pamitan Elegan
            const farewellMsg = `╔══════════════════════════════╗
║      👋 *GOODBYE MESSAGE*      ║
╚══════════════════════════════╝

Terima kasih telah menggunakan Vurx12 Premium! 🤖
Bot akan meninggalkan grup ini atas perintah Owner.

Jika butuh lagi, silakan hubungi Owner untuk di-invite ulang.

💎 *Powered by FORTXX © 2026*
 *Protected by Wabase-MD Protocol*`.trim();

            await sock.sendMessage(targetGid, { text: farewellMsg });
            
            // Delay 3 detik biar user sempat baca
            await new Promise(r => setTimeout(r, 3000));

            // Keluar & Catat Log
            await sock.groupLeave(targetGid);
            
            const logs = readJson(GROUP_LOGS_PATH);
            logs.push({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                action: 'leave',
                gid: targetGid,
                reason: 'owner_command',
                operator: senderNumber
            });
            writeJson(GROUP_LOGS_PATH, logs);

            await sock.sendMessage(senderNumber + '@s.whatsapp.net', { 
                text: `✅ *BERHASIL KELUAR GRUP*\n\nGID: \`${targetGid}\`\nPesan pamitan terkirim.` 
            });
            return;
        }

        // === CEK STATISTIK GRUP ===
        if (cmd === 'grouplist' || cmd === 'groupstats') {
            const logs = readJson(GROUP_LOGS_PATH);
            if (logs.length === 0) {
                return await sock.sendMessage(chatId, { text: `📭 *BELUM ADA DATA*\n\nBelum ada riwayat join/leave grup.` }, { quoted: m });
            }

            const joins = logs.filter(l => l.action === 'join').length;
            const leaves = logs.filter(l => l.action === 'leave').length;
            const recentLogs = logs.slice(-5).reverse();
            
            let statsText = `══════════════════════════════╗
║      📊 *GROUP ANALYTICS*      ║
╚══════════════════════════════╝

📈 *Ringkasan:*
✔️ Total Join: ${joins} Grup
👋 Total Leave: ${leaves} Grup
📂 Total Log: ${logs.length} Entry

🗂️ *5 Aktivitas Terakhir:*\n\n`;

            recentLogs.forEach((log, i) => {
                const date = new Date(log.timestamp).toLocaleString('id-ID');
                const emoji = log.action === 'join' ? '🟢' : '🔴';
                const detail = log.action === 'join' 
                    ? `${log.gname} (${log.members} member)` 
                    : log.reason || 'Owner Command';
                    
                statsText += `${i + 1}. ${emoji} *${log.action.toUpperCase()}*\n`;
                statsText += `    ${date}\n`;
                statsText += `    ${detail}\n`;
                statsText += `    Op: \`${log.operator}\`\n\n`;
            });

            statsText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 *Vurx12 Premium Group Manager*`.trim();

            await sock.sendMessage(chatId, { text: statsText }, { quoted: m });
            return;
        }

        // Default Help
        await sock.sendMessage(chatId, { 
            text: `⚠️ *COMMAND TIDAK DIKENAL*\n\nGunakan:\n• *${prefix}join [link]* - Masuk grup\n• *${prefix}leave* - Keluar grup (di grup target)\n• *${prefix}grouplist* - Lihat statistik` 
        }, { quoted: m });
    }
};
