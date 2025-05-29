const WebTorrent = require('webtorrent');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const client = new WebTorrent();

module.exports = {
  command: ['movie', 'moviedl'],
  description: 'Download and send a movie via torrent',
  async handler(m, { conn, text }) {
    if (!text) {
      return conn.sendMessage(m.chat, { text: '🎬 Please provide a movie name. Example: `.movie Interstellar`' });
    }

    // Search YTS
    const searchUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(text)}`;
    let response;
    try {
      response = await axios.get(searchUrl);
    } catch (e) {
      return conn.sendMessage(m.chat, { text: '❌ Failed to fetch movie info.' });
    }

    const movies = response.data.data.movies;
    if (!movies || movies.length === 0) {
      return conn.sendMessage(m.chat, { text: '❌ Movie not found. Try a different name.' });
    }

    const movie = movies[0];
    const torrent = movie.torrents.find(t => t.quality === '720p') || movie.torrents[0];
    const magnetURI = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}&tr=udp://tracker.opentrackr.org:1337/announce`;

    conn.sendMessage(m.chat, { text: `⬇️ Downloading *${movie.title} (${torrent.quality})*... Please wait.` });

    // Download movie
    client.add(magnetURI, { path: './downloads' }, torrent => {
      const file = torrent.files.find(f => f.name.endsWith('.mp4'));
      if (!file) {
        return conn.sendMessage(m.chat, { text: '❌ MP4 file not found in torrent.' });
      }

      const filePath = path.join('./downloads', file.name);
      file.getBuffer(async (err, buffer) => {
        if (err) return conn.sendMessage(m.chat, { text: '❌ Failed to download movie file.' });

        fs.writeFileSync(filePath, buffer);

        // Send as document (no size check)
        try {
          await conn.sendMessage(m.chat, {
            document: fs.readFileSync(filePath),
            fileName: file.name,
            mimetype: 'video/mp4'
          });
        } catch (e) {
          await conn.sendMessage(m.chat, { text: `❌ Failed to send movie. File may be too large for WhatsApp.\n\nYou can manually find it in Replit's file system under \`./downloads/${file.name}\`` });
        }

        fs.unlinkSync(filePath);
      });
    });
  }
};
