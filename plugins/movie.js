const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "movie",
    alias: ["ytstor", "ytstorrent"],
    react: '🎥',
    category: "download",
    desc: "Search movies from YTS and download via torrent",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please enter a movie name!");

        const searchUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}&limit=1`;
        const data = await fetchJson(searchUrl);

        if (!data || !data.data || !data.data.movies || data.data.movies.length === 0) {
            return await reply("❌ No movies found.");
        }

        const movie = data.data.movies[0];
        const torrent = movie.torrents.find(t => t.quality === '1080p') || movie.torrents[0];

        if (!torrent || !torrent.url) {
            return await reply("❌ No torrent found for this movie.");
        }

        const magnetLink = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title_long)}&tr=udp://tracker.openbittorrent.com:80`;

        await reply(`🎬 *${movie.title_long}*\n📥 Downloading via torrent (1080p)...\n⏳ Please wait, this may take a few minutes.`);

        // Use WebTorrent dynamically (IMPORTANT)
        const WebTorrentModule = await import('webtorrent');
        const WebTorrent = WebTorrentModule.default;
        const client = new WebTorrent();

        client.add(magnetLink, torrent => {
            const file = torrent.files.find(f => f.name.endsWith('.mp4'));
            if (!file) return reply('❌ No MP4 file found in torrent.');

            const filePath = path.join(__dirname, file.name);
            const stream = file.createReadStream();
            const writeStream = fs.createWriteStream(filePath);

            stream.pipe(writeStream);

            writeStream.on('finish', async () => {
                await robin.sendMessage(from, {
                    document: fs.createReadStream(filePath),
                    mimetype: 'video/mp4',
                    fileName: file.name,
                    caption: `🎬 *${movie.title_long}*\n✅ Download complete (1080p).`,
                    quoted: mek
                });

                fs.unlinkSync(filePath);
                client.destroy();
            });

            writeStream.on('error', async (err) => {
                console.error(err);
                await reply('❌ Failed to save the movie.');
                client.destroy();
            });
        });

    } catch (err) {
        console.error("Torrent error:", err);
        await reply("❌ Something went wrong while downloading the movie.");
    }
});
