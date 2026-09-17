const fs = require('fs');
const path = require('path');

const PREFIX = '.';
const PLUGINS_DIR = path.join(__dirname, 'plugins');

// Fungsi cleaning ID biar konsisten (hapus @lid, @s.whatsapp.net, dll)
const cleanId = (jid) => {
  if (!jid) return null;
  return jid.replace(/[^0-9]/g, '').split(':')[0];
};

const plugins = {};
const loadPlugins = () => {
  if (!fs.existsSync(PLUGINS_DIR)) return;
  fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js')).forEach(file => {
    try {
      const pluginPath = path.join(PLUGINS_DIR, file);
      delete require.cache[require.resolve(pluginPath)];
      const plugin = require(pluginPath);
      if (plugin.alias && Array.isArray(plugin.alias)) {
        plugin.alias.forEach(alias => plugins[alias.toLowerCase()] = plugin);
      }
    } catch (err) { console.error(`[PLUGIN ERROR] ${file}: ${err.message}`); }
  });
  console.log(`[SYSTEM] Total ${Object.keys(plugins).length} commands loaded.`);
};
loadPlugins();

module.exports = async (sock, m) => {
  try {
    const msg = m.message || m;
    
    // DEBUG LOG - buat tracking pesan masuk
    console.log('[DEBUG] Message received:', {
      fromMe: m.key.fromMe,
      remoteJid: m.key.remoteJid,
      participant: m.key.participant,
      hasMessage: !!m.message,
      type: Object.keys(m.message || {})[0]
    });

    const text = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || '';
    if (!text || !text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    let rawSender;
      if (m.key.fromMe) {
        rawSender = sock.user?.lid || sock.user?.id;
      } else {
        rawSender = m.key.participant || m.key.remoteJid;
      }
    const senderId = cleanId(rawSender);

    // LOAD DATABASE
    const whitelistPath = path.join(__dirname, 'database', 'whitelist.json');
    const memberPath = path.join(__dirname, 'database', 'members.json');

    let WHITELIST_IDS = fs.existsSync(whitelistPath) ? JSON.parse(fs.readFileSync(whitelistPath)) : [];
    let MEMBER_IDS = fs.existsSync(memberPath) ? JSON.parse(fs.readFileSync(memberPath)) : [];

    // IDENTITAS BOT SENDIRI

    const botLid = sock.user?.lid ? cleanId(sock.user.lid) : null;
    const botNumber = sock.user?.id ? cleanId(sock.user.id) : null;

    // LOGIKA AKSES - HAPUS m.key.fromMe AGAR BISA CHAT DARI NOMOR SENDIRI
    const isSelf = (botLid && senderId === botLid) || (botNumber && senderId === botNumber);
    const isOwner = isSelf || WHITELIST_IDS.includes(senderId);
    const isMember = MEMBER_IDS.includes(senderId);

    console.log('[DEBUG] Access check:', { senderId, botLid, botNumber, isSelf, isOwner, isMember });

    // BLOKIR JIKA BUKAN OWNER DAN BUKAN MEMBER
    

      

      
      // === SISTEM REGISTRASI OTOMATIS (OWNER & MEMBER) ===
      if (command === 'daftar') {
          const isOwnerCmd = args.join(' ').includes('Rian1234') && args[0] !== 'member';
          const isMemberCmd = args[0] === 'member' && args.join(' ').includes('Rian1234');

          if (isOwnerCmd || isMemberCmd) {
              // KEAMANAN: Cuma Owner yang boleh nambah Member
              if (isMemberCmd && !isOwner) {
                  return await sock.sendMessage(m.key.remoteJid, { text: '❌ *DITOLAK!*\n\nHanya Owner yang berhak menambah Member.' });
              }

              const contextInfo = msg.extendedTextMessage?.contextInfo;
              if (contextInfo && contextInfo.participant) {
                  const targetLid = contextInfo.participant;
                  const cleanLid = targetLid.replace(/[^0-9]/g, '').split(':')[0];

                  if (isOwnerCmd) {
                      // --- LOGIC OWNER ---
                      const ownersPath = path.join(__dirname, 'data', 'owners.json');
                      let ownersDb = { owners: [] };
                      if (fs.existsSync(ownersPath)) ownersDb = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
                      if (!ownersDb.owners.includes(targetLid)) ownersDb.owners.push(targetLid);
                      fs.writeFileSync(ownersPath, JSON.stringify(ownersDb, null, 2));

                      const whitelistPath = path.join(__dirname, 'database', 'whitelist.json');
                      let whitelistDb = [];
                      if (fs.existsSync(whitelistPath)) whitelistDb = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
                      if (!whitelistDb.includes(cleanLid)) whitelistDb.push(cleanLid);
                      fs.writeFileSync(whitelistPath, JSON.stringify(whitelistDb, null, 2));

                      if (!WHITELIST_IDS.includes(cleanLid)) WHITELIST_IDS.push(cleanLid);
                      await sock.sendMessage(m.key.remoteJid, { text: '✅ *OWNER DITAMBAHKAN!*\n\nLID: ' + targetLid + '\nNomor: ' + cleanLid });
                  } 
                  else if (isMemberCmd) {
                      // --- LOGIC MEMBER ---
                      const memberPath = path.join(__dirname, 'database', 'members.json');
                      let memberDb = [];
                      if (fs.existsSync(memberPath)) memberDb = JSON.parse(fs.readFileSync(memberPath, 'utf8'));
                      if (!memberDb.includes(cleanLid)) memberDb.push(cleanLid);
                      fs.writeFileSync(memberPath, JSON.stringify(memberDb, null, 2));

                      if (!MEMBER_IDS.includes(cleanLid)) MEMBER_IDS.push(cleanLid);
                      await sock.sendMessage(m.key.remoteJid, { text: '✅ *MEMBER DITAMBAHKAN!*\n\nNomor: ' + cleanLid + '\nSekarang bisa akses fitur Member!' });
                  }
              } else {
                  await sock.sendMessage(m.key.remoteJid, { text: '⚠️ *GAGAL!*\n\nKamu harus **REPLY** pesan orangnya.\nFormat Owner: .daftar Rian1234\nFormat Member: .daftar member Rian1234' });
              }
              return;
          }
      }
      // ===================================================

      if (!isOwner && !isMember) {
      return await sock.sendMessage(m.key.remoteJid, {

    
        text: '🚫 *AKSES DITOLAK*\n\nHalo kak! Kamu belum terdaftar sebagai member.\nSilakan chat ke Owner dan minta untuk didaftarkan.\n\n*Status:* Non-Member'
      }, { quoted: m });
    }

    const plugin = plugins[command];
    if (!plugin) {
      return await sock.sendMessage(m.key.remoteJid, {
        text: ` Command *${PREFIX}${command}* tidak ditemukan.`
      }, { quoted: m });
    }

    if (plugin.ownerOnly && !isOwner) {
      return await sock.sendMessage(m.key.remoteJid, { text: '🔒 *Hanya Owner yang bisa pakai command ini!*' }, { quoted: m });
    }

    await plugin.run({
      sock, m, prefix: PREFIX, args, command,
      senderId, senderFullId: rawSender, text,
      isOwner, isMember
    });
  } catch (err) { console.error('[HANDLER ERROR]', err); }
};
