const { cmd } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const MOVIE_API_KEY = config.MOVIE_API_KEY;
const SEARCH_API = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_API = "https://api.skymansion.site/movies-dl/download";

// 🔥 Google thumbnail/description scraper
async function getGoogleMovieInfo(query) {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " movie")}&hl=en`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);
    const title = $('h2 span').first().text().trim() || query;
    const desc = $('div[data-attrid="kc:/film/film:plot"] span').first().text().trim() || 'No description available.';
    const img = $('g-img img').first().attr('src') || null;

    return {
      title,
      description: desc,
      image: img ? `https:${img}` : null
    };
  } catch {
    return { title: query, description: 'No description found.', image: null };
  }
}

cmd({
  pattern: "movie",
  alias: ["moviedl"],
  react: '🎬',
  category: "download",
  desc: "Search and download movies from PixelDrain",
  filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a movie name.");

    const search = await fetchJson(`${SEARCH_API}?q=${encodeURIComponent(q)}&api_key=${MOVIE_API_KEY}`);
    const result = search?.SearchResult?.result?.[0];
    if (!result) return reply(`❌ No results found for "${q}".`);

    const detail = await fetchJson(`${DOWNLOAD_API}/?id=${result.id}&api_key=${MOVIE_API_KEY}`);
    const link = detail?.downloadLinks?.result?.links?.driveLinks?.find(v => v.quality === "HD 720p");

    if (!link?.link?.startsWith("https://")) return reply("❌ No downloadable 720p link found.");

    const fileId = link.link.split("/").pop();
    const downloadUrl = `https://pixeldrain.com/api/file/${fileId}?download`;

    // 👇 Get thumbnail + description
    const { title, description, image } = await getGoogleMovieInfo(result.title);

    if (image) {
      await robin.sendMessage(from, {
        image: { url: image },
        caption: `🎬 *${title}*\n\n📝 ${description}\n\n📥 Sending 720p file...`
      }, { quoted: mek });
    } else {
      await reply(`🎬 *${title}*\n\n📝 ${description}\n\n📥 Sending 720p file...`);
    }

    // 👇 Download and send file
    const filePath = path.join(__dirname, `${title.replace(/[^\w]/g, "_")}.mp4`);
    const writer = fs.createWriteStream(filePath);
    const { data } = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });

    data.pipe(writer);
    writer.on("finish", async () => {
      await robin.sendMessage(from, {
        document: fs.readFileSync(filePath),
        mimetype: "video/mp4",
        fileName: `${title}-720p.mp4`,
        caption: `✅ *${title}* sent successfully.`
      }, { quoted: mek });
      fs.unlinkSync(filePath);
    });

    writer.on("error", async err => {
      console.error(err);
      await reply("❌ Failed to download video.");
    });

  } catch (e) {
    console.error(e);
    reply("❌ An error occurred.");
  }
});
