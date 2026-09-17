const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: 'GANTI_DENGAN_API_KEY_GROQ_KAMU' });

// PENGETAHUAN BOT + DAFTAR PERTANYAAN MENARIK
const BOT_KNOWLEDGE = `
Kamu adalah Wabase-MD, asisten AI cerdas & asik untuk bot WhatsApp Vurx12 Premium. 
Fakta Mutlak tentang Bot Ini:
- Nama: Vurx12 Premium v3.0 | Creator: FORTXX (2026)
- Keamanan: Wabase-MD Security Protocol
- Command Penting: .menu (lihat semua fitur), .addblacklist (blokir user), .delblacklist (pulihkan akses), .ping (cek speed), .halo (sapa bot), .play/.tiktok/.ig (download), .s/.toimg (sticker), .qc (fake quote), .tts (suara AI), .kick/.promote/.demote (grup), .setppbot/.mode (owner only), .eval/.exec (debug owner).
- Aturan Respon: Jawab dalam Bahasa Indonesia yang santai, ramah, & profesional. Pakai emoji secukupnya. Jangan buat-buat info. Jika ditanya soal owner/blacklist, jawab tegas sesuai fakta di atas.`;

const SUGGESTED_QUESTIONS = [
    "👤 Siapa creator bot ini?",
    "️ Apa fungsi .addblacklist?",
    "📜 Sebutkan command khusus Owner!",
    "⚡ Cek kecepatan server bot dong",
    "🎵 Cara download lagu YouTube gimana?",
    "🤖 Buatkan caption jualan online shop",
    "💡 Tips aman pakai bot WhatsApp",
    "🔒 Kenapa saya kena blacklist?"
];

module.exports = {
    name: 'ai',
    alias: ['ai', 'chatgpt', 'gpt', 'ask', 'tanya'],
    desc: 'Chat pintar dengan AI Premium Groq.',
    category: 'general',
    requiredLevel: 0,

    run: async ({ sock, m, prefix, args, senderId }) => {
        const chatId = m.key.remoteJid;
        const query = args.join(' ');

        // Tampilan Validasi Input yang Menarik + List Pertanyaan
        if (!query) {
            const suggestionsText = SUGGESTED_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n');
            
            return await sock.sendMessage(chatId, { 
                text: `✨ *HALO! ADA YANG BISA DIBANTU?* ✨

Aku Wabase-MD, asisten AI premium kamu! 🤖
Ketik pertanyaanmu atau pilih topik di bawah ini:

${suggestionsText}

🆔 *User ID:* \`${senderId}\`
💎 *Vurx12 Premium AI Engine*`.trim() 
            }, { quoted: m });
        }

        // Typing Indicator Smooth
        await sock.sendPresenceUpdate('composing', chatId);

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: BOT_KNOWLEDGE },
                    { role: 'user', content: query }
                ],
                model: 'openai/gpt-oss-20b',
                temperature: 0.7,
                max_tokens: 1024
            });

            let answer = chatCompletion.choices[0]?.message?.content || 'Maaf, tidak ada jawaban.';
            answer = answer.replace(/```[\s\S]*?```/g, '').trim();

            const aiText = `🤖 *WABASE AI PREMIUM* 🤖

🗣️ *Pertanyaan:* 
_${query}_

━━━━━━━━━━━━━━━━━━━━━━
💡 *Jawaban:*
${answer}

━━━━━━━━━━━━━━━━━━━━━━
🆔 *User ID:* \`${senderId}\`
⚡ *Model:* GPT-OSS-20B | Groq API
💎 *Powered by FORTXX © 2026*`.trim();

            await sock.sendMessage(chatId, { text: aiText }, { quoted: m });

        } catch (e) {
            console.error('[AI] Primary Error:', e.message);

            // Fallback Mode
            try {
                const fallback = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: BOT_KNOWLEDGE },
                        { role: 'user', content: query }
                    ],
                    model: 'openai/gpt-oss-120b',
                    temperature: 0.7,
                    max_tokens: 1024
                });

                let ans = fallback.choices[0]?.message?.content || 'Error fallback.';
                ans = ans.replace(/```[\s\S]*?```/g, '').trim();

                const fallbackText = `🔄 *AI FALLBACK MODE* 🔄

🗣️ *Pertanyaan:* 
_${query}_

━━━━━━━━━━━━━━━━━━━━━━
💡 *Jawaban (Cadangan):*
${ans}

━━━━━━━━━━━━━━━━━━━━━━
⚠️ Model utama sedang sibuk.
Menggunakan GPT-OSS-120B sebagai backup.

🆔 *User ID:* \`${senderId}\`
💎 *Vurx12 Premium AI Engine*`.trim();

                await sock.sendMessage(chatId, { text: fallbackText }, { quoted: m });

            } catch (e2) {
                console.error('[AI] Fallback Error:', e2.message);
                
                const errorText = `⚠️ *AI SEDANG OFFLINE* ⚠️

Server AI sedang maintenance teknis. 
Coba lagi dalam beberapa detik ya! 🙏

🆔 *User ID:* \`${senderId}\`
🔧 *Status:* Maintenance Mode
💎 *Vurx12 Premium Support*`.trim();

                await sock.sendMessage(chatId, { text: errorText }, { quoted: m });
            }
        }
    }
};
