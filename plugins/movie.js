const { cmd } = require("../command");
const axios = require("axios");

const API_KEY = "sky|bfc07870633518de653fc608e775a88f39037522";
const BASE_URL = "https://skymansion.in/api"; // (replace with actual API base URL if different)

cmd(
  {
    pattern: "movie",
    react: "🎬",
    desc: "Download movie via Skymansion API",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, reply, q, quoted }) => {
    try {
      if (!q) return reply("❌ Please provide a movie name to search.");

      // 1. Search movie by name
      const searchRes = await axios.get(`${BASE_URL}/search`, {
        params: {
          api_key: API_KEY,
          query: q,
        },
      });

      if (!searchRes.data || !searchRes.data.results || searchRes.data.results.length === 0)
        return reply("❌ No movie found with that name.");

      // Pick first movie result
      const movie = searchRes.data.results[0];

      // 2. Get download links/details by movie ID
      const detailRes = await axios.get(`${BASE_URL}/movie/${movie.id}`, {
        params: {
          api_key: API_KEY,
        },
      });

      if (!detailRes.data || !detailRes.data.download_links)
        return reply("❌ No download links found for this movie.");

      // 3. Choose preferred quality or first link
      const downloadLink = detailRes.data.download_links.find(dl => dl.quality === "720p") || detailRes.data.download_links[0];

      if (!downloadLink) return reply("❌ No suitable download link found.");

      // 4. Send movie info and download link (or start download & send file if feasible)
      let caption = `🎬 *${movie.title}* (${movie.year})\n\n`;
      caption += `📥 Download link (${downloadLink.quality}):\n${downloadLink.url}\n\n`;
      caption += "𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999";

      await robin.sendMessage(
        from,
        {
          text: caption,
        },
        { quoted: mek }
      );

      // Optional: If you want to download and send the movie file:
      // const movieBuffer = await axios.get(downloadLink.url, { responseType: "arraybuffer" });
      // await robin.sendMessage(from, {
      //   document: movieBuffer.data,
      //   mimetype: "video/mp4",
      //   fileName: `${movie.title}.mp4`,
      //   caption: `🎬 ${movie.title} 𝐌𝐚𝐝𝐞 𝐛𝐲 WARU999`,
      // }, { quoted: mek });

    } catch (err) {
      console.error(err);
      reply("❌ Error fetching movie data: " + err.message);
    }
  }
);
