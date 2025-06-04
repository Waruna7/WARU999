const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "tiktok",
    react: "🔥",
    desc: "Download TikTok video",
    category: "download",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    { from, q, reply }
  ) => {
    try {
      if (!q) return reply("*Send a valid TikTok video link.* 🔗");

      // Download via external API
      const api = `https://api.tiklydown.me/api/download?url=${encodeURIComponent(q)}`;
      const res = await axios.get(api);

      if (!res.data || !res.data.video || !res.data.video.noWatermark) {
        return reply("❌ Failed to download TikTok video.");
      }

      const videoUrl = res.data.video.noWatermark;

      await robin.sendMessage(
        from,
        {
          video: { url: videoUrl },
          caption: "🔥 *TikTok Video Downloaded Successfully!*\n\n𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999",
        },
        { quoted: mek }
      );

      reply("*Thanks for using my bot!* 🔥❤️");
    } catch (err) {
      console.error(err);
      reply(`❌ Error: ${err.message}`);
    }
  }
);
