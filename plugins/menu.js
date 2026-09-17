module.exports = {
    name: 'menu',
    alias: ['menu', 'help', 'commands', 'allmenu', 'daftar'],
    desc: 'Menampilkan daftar lengkap semua command bot',
    category: 'general',
    
    run: async function(obj) {
        const sock = obj.sock || obj.client || obj.bot;
        const m = obj.m || obj.msg || obj.message;
        const prefix = obj.prefix || '.';
        
        if (!sock || !m) return;
        
        const chatId = m.key?.remoteJid || m.chat;
        
        let senderNumber = 'Unknown';
        try {
            if (m.sender) senderNumber = m.sender.split('@')[0];
            else if (m.key?.participant) senderNumber = m.key.participant.split('@')[0];
            else if (chatId && chatId.includes('@')) senderNumber = chatId.split('@')[0];
        } catch(e) { /* ignore */ }
        
        const waktu = new Date().toLocaleString('id-ID', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const menuText = `✨ *VURX12 PREMIUM v4.0* 
🛡️ *SECURE SYSTEM ACTIVE*

👤 *User:* _${senderNumber}_
⏰ *Waktu:* _${waktu}_

━━━━━━━━━━━━━━━━━━━━━━━━
  *BROADCAST & SYSTEM*
━━━━━━━━━━━━━━━━━━━━━━━━
• .bc [pesan] → Broadcast massal
• .bc --preview → Preview broadcast
• .bcstats → Riwayat & analytics broadcast
• .shutdown → Graceful shutdown bot
• .restart → Restart bot

━━━━━━━━━━━━━━━━━━━━━━━━
 👥 *SMART GROUP MANAGER*
━━━━━━━━━━━━━━━━━━━━━━━━
• .join [link] → Masuk grup (anti-spam)
• .leave → Keluar grup (graceful exit)
• .grouplist → Statistik & riwayat grup
• .kick / .promote / .demote
• .tagall / .link / .testadmin
• .addblacklist / .delblacklist / .listblacklist

━━━━━━━━━━━━━━━━━━━━━━━━
  *ASSET & SESSION MANAGER*
━━━━━━━━━━━━━━━━━━━━━━━━
• .take Nama|Author → Rebrand sticker
• .clearsession smart → Cleanup sesi aman
• .clearsession full → Hapus semua sesi
• .sessioninfo → Cek kesehatan server

━━━━━━━━━━━━━━━━━━━━━━━━
 🔐 *TIER-0 GOD MODE*
━━━━━━━━━━━━━━━━━━━━━━━━
• .eval [kode] → Jalankan JS (sandbox VM2)
• .exec [cmd] → Shell command
• .exec --dry-run → Simulasi exec aman
• .getsession → Download sesi (encrypted)
• .setpin [pin] → Ubah PIN keamanan

━━━━━━━━━━━━━━━━━━━━━━━━
  *DOWNLOADER & MEDIA*
━━━━━━━━━━━━━━━━━━━━━━━━
• .play / .ytmp4 → YouTube MP3/MP4
• .tiktok / .ig → Social Media DL
• .s / .toimg → Sticker Converter
• .tomp3 → Video to Audio
• .qc → Fake Quote Chat

━━━━━━━━━━━━━━━━━━━━━━━━
 🤖 *AI & INTERAKTIF*
━━━━━━━━━━━━━━━━━━━━━━━━
• .ai → Smart Chatbot
• .tts → Natural AI Voice
• .halo / .ping → Bot Status Check

━━━━━━━━━━━━━━━━━━━━━━━━
 👑 *OWNER TOOLS*
━━━━━━━━━━━━━━━━━━━━━━━━
• .setppbot / .setname / .mode
• .block / .unblock
• .status → Bot info & runtime

💎 *Premium by FORTXX © 2026*
🔒 *Protected by Wabase-MD Protocol*
⚡ *Total 92+ Commands Loaded*`.trim();

        try {
            await sock.sendMessage(chatId, { 
                text: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363123456789012@newsletter',
                        newsletterName: 'Vurx12 Premium',
                        serverMessageId: -1
                    }
                }
            }, { quoted: m });
        } catch(e) {
            console.log('[MENU ERROR]', e.message);
        }
    }
};
