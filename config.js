// ═══════════════════════════════════════════════════
//   Vurx12 CONFIGURATION FILE (REBUILT)
//   Made with ❤️ by FORTXX | Fixed for LID Auth
// ═══════════════════════════════════════════════════

module.exports = {
    // ===== IDENTITAS BOT =====
    botName: 'Vurx12',
    botVersion: '2.0.0',
    ownerName: 'FORTXX',
    ownerNumber: '70124551819326@lid', 
    coOwnerNumbers: ['268921357783190'], 
    botNumber: '', 

    // ===== KONFIGURASI DASAR =====
    prefix: '.',
    mode: 'public', 
    autoRead: false,
    autoTyping: true,
    autoRecording: false,
    alwaysOnline: true,

    // ===== GRUP SETTINGS =====
    groupSettings: {
        antiLink: true,
        antiBadword: true,
        antiToxic: true,
        welcome: true,
        leave: true,
        promote: true,
        demote: true,
        antidelete: false,
        viewonce: false,
        simi: false,
        detect: true,
    },

    // ===== DOWNLOADER SETTINGS =====
    downloader: {
        tiktok: { watermark: false, quality: 'hd' },
        youtube: { maxDuration: 600, quality: '720p', audioQuality: '128kbps' },
        instagram: { maxMedia: 10 },
        facebook: { quality: 'hd' }
    },

    // ===== AI & CHATBOT SETTINGS =====
    ai: {
        provider: 'blackbox',
        simsimi: { language: 'id', enabled: false },
        openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 2048 },
        gemini: { apiKey: '', model: 'gemini-pro' },
        blackbox: { enabled: true, systemPrompt: 'Kamu adalah Wabase-MD, asisten AI yang membantu dan ramah.' }
    },

    // ===== STICKER SETTINGS =====
    sticker: {
        packName: 'Wabase-MD',
        authorName: 'FORTXX',
        categories: ['😀', '😍', '🥰', '😂', '😭', '', '👍', '', '❤️', '💔'],
        autoSticker: false,
        autoStickerVideo: false
    },

    // ===== TTS (TEXT TO SPEECH) =====
    tts: { language: 'id', voice: 'female', speed: 1.0 },

    // ===== IMAGE PROCESSING =====
    image: {
        remini: { enabled: true, version: 'v3' },
        removebg: { enabled: true, apiKey: '' },
        upscale: { enabled: true, scale: 2 }
    },

    // ===== GAME & FUN =====
    game: {
        tebakGambar: true, tebakLirik: true, tebakKata: true,
        tebakBendera: true, tebakKimia: true, tebakMath: true,
        suit: true, tictactoe: true, mathQuiz: true
    },

    // ===== STORE & DATABASE =====
    database: {
        type: 'json',
        path: './database',
        mongodb: { url: '', dbName: 'wabase_md' }
    },

    // ===== PREMIUM & LIMIT =====
    premium: {
        enabled: true,
        limit: { free: 15, premium: 999, resetTime: '00:00' },
        features: ['remini', 'removebg', 'upscale', 'ytmp4', 'ytmp3', 'tiktok', 'instagram', 'facebook', 'twitter']
    },

    // ===== LOG & DEBUG =====
    logging: { level: 'info', saveToFile: true, filePath: './logs/bot.log', maxFileSize: '10mb' },

    // ===== SESSION & SECURITY =====
    session: { path: './session', saveCreds: true, autoReconnect: true, maxRetries: 5 },

    // ===== API KEYS (GRATIS) =====
    apiKeys: {
        siputzx: 'https://api.siputzx.my.id',
        betabotz: 'https://api.betabotz.eu.org',
        widipe: 'https://widipe.com',
        ryzendesu: 'https://api.ryzendesu.vip',
        saipul: 'https://saipulanuar.ga',
        removebg: '', openai: '', google: ''
    },

    // ===== THUMBNAIL & MEDIA =====
    media: {
        thumbnail: 'https://i.imgur.com/placeholder.jpg',
        watermark: { enabled: false, text: 'Wabase-MD', position: 'bottom-right' }
    },

    // ===== MESSAGE TEMPLATES =====
    messages: {
        welcome: 'Halo @user! Selamat datang di @group. Baca deskripsi ya!',
        leave: 'Selamat tinggal @user! Semoga harimu menyenangkan.',
        promote: '@user sekarang jadi admin grup!',
        demote: '@user bukan admin lagi.',
        antiLink: '❌ Link terdeteksi! Pesan dihapus.',
        antiBadword: '⚠️ Kata tidak sopan terdeteksi! Pesan dihapus.',
        limit: '️ Limit harian kamu habis! Coba lagi besok.',
        premiumOnly: ' Fitur ini khusus premium!',
        ownerOnly: '👑 Command ini khusus Owner!',
        groupOnly: '👥 Command ini hanya untuk grup!',
        privateOnly: '🔒 Command ini hanya untuk chat pribadi!',
        botAdmin: ' Bot harus jadi admin dulu!',
        userAdmin: '👮 Kamu harus admin dulu!',
        error: '❌ Terjadi error! Coba lagi nanti.',
        processing: '⏳ Sedang memproses...'
    },

    // ===== SCHEDULED TASKS =====
    schedule: {
        enabled: false,
        tasks: [
            { name: 'resetLimit', time: '00:00', enabled: true },
            { name: 'clearTemp', time: '03:00', enabled: true }
        ]
    },

    // ===== PLUGIN SETTINGS =====
    plugins: {
        autoLoad: true,
        folder: './plugins',
        blacklist: [],
        whitelist: []
    },

    // ===== MISC =====
    misc: {
        maxFileSize: 50,
        maxMessageLength: 4096,
        cooldown: 3,
        antiSpam: true,
        maxSpam: 5,
        banTime: 3600
    }
};
