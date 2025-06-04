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
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("*Send a valid TikTok video link.* 🔗");

      // TikMate API endpoint for downloading TikTok video
      const api = `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(q)}`;

      const res = await axios.get(api);

      if (!res.data || !res.data.data || !res.data.data.play) {
        return reply("❌ Failed to download TikTok video.");
      }

      // This URL is the direct video link without watermark
      const videoUrl = res.data.data.play;

      // Send the video as a message
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
