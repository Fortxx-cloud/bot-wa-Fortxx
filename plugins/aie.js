const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Fal.ai API Key lo
const FAL_KEY = 'b229ba12-485e-42a1-bfad-63deb8032092:8'; 

module.exports = {
  alias: ['aienhance', 'kisaraenhance'],
  requiredLevel: 0,
  run: async ({ sock, m, prefix, args }) => {
    try {
      const mode = args && args.length > 0 ? args[0].toLowerCase().replace(/[^\w]/g, '') : "";
      
      if (!['anime', 'manga', 'ghibli'].includes(mode)) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: `❗ Mode tidak valid. Gunakan: anime, manga, ghibli`
        }, { quoted: m });
      }

      let quotedMsg = null;
      if (m.message?.extendedTextMessage) {
        quotedMsg = m.message.extendedTextMessage.contextInfo?.quotedMessage;
      } else if (m.message?.conversation) {
        quotedMsg = m.message;
      }

      if (!quotedMsg || !quotedMsg.imageMessage) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: ` *AI Enhancer*\n\nReply gambar dengan:\n• ${prefix}aienhance anime\n• ${prefix}aienhance manga\n• ${prefix}aienhance ghibli`
        }, { quoted: m });
      }

      const buffer = await downloadMediaMessage({ message: quotedMsg, key: m.key }, 'buffer', {}, {});
      const type = await fileTypeFromBuffer(buffer);
      
      if (!type || !["image/jpeg", "image/jpg", "image/png"].includes(type.mime)) {
        throw "Format gambar harus JPG atau PNG.";
      }

      console.log(`[AIE] Uploading to Fal.ai (${mode})...`);

      // Upload gambar ke Fal.ai storage dulu (wajib buat image-to-image)
      const uploadRes = await axios.post(
        "https://upload.fal.ai/upload",
        buffer,
        {
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": type.mime
          },
          responseType: 'json'
        }
      );

      if (!uploadRes.data?.url) throw "Gagal upload gambar ke Fal.ai";

      console.log(`[AIE] Image uploaded: ${uploadRes.data.url}`);

      // Mapping mode ke model ID Fal.ai yang stabil
      const models = {
        anime: "fal-ai/animeganv2",
        manga: "fal-ai/manga-style-transfer", 
        ghibli: "fal-ai/stable-diffusion-xl-anime"
      };

      // Kirim request inference
      const response = await axios.post(
        `https://queue.fal.run/${models[mode]}`,
        {
          image_url: uploadRes.data.url,
          strength: 0.8
        },
        {
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": "application/json"
          },
          responseType: 'json'
        }
      );

      // Polling sampai hasil selesai
      const requestId = response.data.request_id;
      let result = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await axios.get(
          `https://queue.fal.run/fal-ai/requests/${requestId}/status`,
          { headers: { "Authorization": `Key ${FAL_KEY}` } }
        );
        
        if (status.data.status === "COMPLETED") {
          result = status.data;
          break;
        }
        if (status.data.status === "FAILED") throw "Proses gagal di server Fal.ai";
      }

      if (!result?.output?.images?.[0]?.url) throw "Tidak ada output gambar";

      await sock.sendMessage(m.key.remoteJid, {
        image: { url: result.output.images[0].url },
        caption: `✅ Berhasil diubah ke gaya *${mode}*! (via Fal.ai)`
      }, { quoted: m });

    } catch (e) {
      console.error("[AIE ERROR]", e.response?.data || e.message);
      let errMsg = e.message;
      if (e.response?.status === 401) errMsg = "Fal.ai API Key salah/kosong.";
      if (e.response?.status === 402) errMsg = "Kredit Fal.ai habis, isi ulang di dashboard.";
      
      await sock.sendMessage(m.key.remoteJid, {
        text: `❌ Error: ${errMsg}`
      }, { quoted: m });
    }
  }
};
