const axios = require('axios');
const TEMP = {};

// ⚠️ Replace this with your actual TMDB key:
const TMDB_KEY = '2619480e652a7d92e47cef44c27e96b5';

module.exports = {
  command: ['movie'],
  description: 'Search and download movies via Skymansion API',
  
  async handler(m, { text, conn }) {
    if (!text) return m.reply('🎬 Send movie name like: *!movie Interstellar*');

    try {
      m.reply('🔍 Searching movie...');

      // TMDB Search
      const tmdb = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(text)}&api_key=${TMDB_KEY}`);
      const results = tmdb.data.results;
      if (!results || results.length === 0) return m.reply('❌ Movie not found on TMDB.');

      const movie = results[0];
      const query = movie.title;

      // Skymansion Search
      const sky = await axios.get(`https://skymansion-api.vercel.app/api/v2/search/movie?query=${encodeURIComponent(query)}`);
      const all = sky.data?.data;
      if (!all || all.length === 0) return m.reply('❌ No download links found on Skymansion.');

      // List options
      let msg = `🎬 *${query}*\n📥 Select quality:\n\n`;
      all.forEach((d, i) => {
        msg += `${i + 1}. ${d.quality || 'Unknown'} - ${d.title}\n`;
      });
      msg += `\n_Reply with a number (1-${all.length})_`;

      TEMP[m.sender] = all;
      await conn.sendMessage(m.chat, { text: msg }, { quoted: m });

    } catch (err) {
      console.error(err);
      m.reply('⚠️ Error occurred while searching or fetching download link.');
    }
  },

  async after(m, { conn }) {
    const selected = m.text.trim();
    const options = TEMP[m.sender];

    if (!options || !/^\d+$/.test(selected)) return;
    const index = parseInt(selected) - 1;
    if (!options[index]) return m.reply('❌ Invalid option.');

    const chosen = options[index];
    delete TEMP[m.sender];

    try {
      m.reply(`📥 Downloading *${chosen.title}*...`);

      const res = await axios.get(chosen.url, { responseType: 'arraybuffer' });
      const fileName = chosen.title.replace(/[^\w\s]/gi, '') + '.mp4';

      // ❌ Removed size limitation here (WhatsApp may fail silently >150MB)

      await conn.sendMessage(m.chat, {
        document: res.data,
        fileName,
        mimetype: 'video/mp4'
      }, { quoted: m });

    } catch (err) {
      console.error(err);
      m.reply('⚠️ Failed to download or send the movie.');
    }
  }
};
