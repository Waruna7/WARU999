const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "tiktok",
    react: "🔥",
    desc: "Download TikTok video without watermark",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("*Please send a valid TikTok video link.* 🔗");

      // Call TikMate API to get video info
      const apiUrl = `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(q)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.video || !data.video.no_watermark) {
        return reply("❌ Failed to get TikTok video.");
      }

      const videoUrl = data.video.no_watermark;
      const thumbnail = data.thumbnail;
      const author = data.author || "TikTok User";

      // Send video thumbnail with info
      await robin.sendMessage(
        from,
        {
          image: { url: thumbnail },
          caption: `🔥 *TikTok Video Downloaded*\n👤 Author: ${author}\n\n𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999`,
        },
        { quoted: mek }
      );

      // Send the video itself
      await robin.sendMessage(
        from,
        {
          video: { url: videoUrl },
          caption: `🔥 *TikTok Video*\n\n𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999`,
        },
        { quoted: mek }
      );

      reply("*Thanks for using my bot!* 🔥❤️");
    } catch (error) {
      console.error(error);
      reply(`❌ Error: ${error.message}`);
    }
  }
);
