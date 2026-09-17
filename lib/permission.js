const fs = require('fs');
const path = require('path');

// Konfigurasi Owner (bisa lebih dari 1)
const OWNER_NUMBERS = [
    '6288994324184',  // Ganti dengan nomor kamu (tanpa + atau 0)
    // '6281234567890',  // Tambah owner lain kalau perlu
];

/**
 * Cek apakah nomor adalah Owner
 */
function isOwner(senderId) {
    const number = senderId.split('@')[0];
    return OWNER_NUMBERS.includes(number);
}

/**
 * Cek apakah sender adalah Admin Grup
 */
async function isAdmin(sock, groupId, senderId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === senderId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        return false;
    }
}

/**
 * Cek apakah bot adalah Admin Grup
 */
async function isBotAdmin(sock, groupId, botId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const bot = metadata.participants.find(p => p.id === botId);
        return bot && (bot.admin === 'admin' || bot.admin === 'superadmin');
    } catch (e) {
        return false;
    }
}

/**
 * Sistem Permission Levels
 * Level 0: Member biasa
 * Level 1: Admin Grup
 * Level 2: Owner
 */
const PERMISSION_LEVELS = {
    MEMBER: 0,
    ADMIN: 1,
    OWNER: 2
};

/**
 * Cek permission user
 * Returns: { level, isOwner, isAdmin, canAccess }
 */
async function checkPermission(sock, groupId, senderId, botId, requiredLevel = PERMISSION_LEVELS.MEMBER) {
    const result = {
        level: PERMISSION_LEVELS.MEMBER,
        isOwner: isOwner(senderId),
        isAdmin: false,
        canAccess: false
    };

    // Owner selalu bisa akses semua
    if (result.isOwner) {
        result.level = PERMISSION_LEVELS.OWNER;
        result.canAccess = true;
        return result;
    }

    // Cek admin grup (hanya jika di grup)
    if (groupId && groupId.endsWith('@g.us')) {
        result.isAdmin = await isAdmin(sock, groupId, senderId);
        if (result.isAdmin) {
            result.level = PERMISSION_LEVELS.ADMIN;
        }
    }

    // Cek apakah level cukup
    result.canAccess = result.level >= requiredLevel;

    return result;
}

module.exports = {
    isOwner,
    isAdmin,
    isBotAdmin,
    checkPermission,
    PERMISSION_LEVELS,
    OWNER_NUMBERS
};

