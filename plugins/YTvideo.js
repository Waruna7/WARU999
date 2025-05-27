const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd(
  {
    pattern: "video",
    react: "🎥",
    desc: "Download YouTube Video",
    category: "download",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }
  ) => {
    try {
      if (!q) return reply("*Provide a name or a YouTube link.* 🎥❤️");

      // Search video
      const search = await yts(q);
      const data = search.videos[0];
      const url = data.url;

      // Description message
      let desc = `🎥 *WARU999 VIDEO DOWNLOADER* 🎥

👻 *Title* : ${data.title}
👻 *Duration* : ${data.timestamp}
👻 *Views* : ${data.views}
👻 *Uploaded* : ${data.ago}
👻 *Channel* : ${data.author.name}
👻 *Link* : ${data.url}

𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999`;

      await robin.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Download function
      const downloadVideo = async (url, quality) => {
        const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=${quality}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.success) {
          const { id, title } = response.data;
          const progressUrl = `https://p.oceansaver.in/ajax/progress.php?id=${id}`;

          while (true) {
            const progress = await axios.get(progressUrl);
            if (progress.data.success && progress.data.progress === 1000) {
              const videoBuffer = await axios.get(progress.data.download_url, {
                responseType: "arraybuffer",
              });
              return { buffer: videoBuffer.data, title };
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } else {
          throw new Error("Failed to fetch video details.");
        }
      };

      const quality = "360";
      const video = await downloadVideo(url, quality);
      const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");

      await robin.sendMessage(
        from,
        {
          document: video.buffer,
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎥 *${video.title}*\n\n𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999`,
        },
        { quoted: mek }
      );

      reply("*Thanks for using my bot!* 🎥❤️");
    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
