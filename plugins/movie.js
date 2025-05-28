const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "movie",
    alias: ["yts", "torrent"],
    react: '🎬',
    category: "download",
    desc: "Download movie from YTS via torrent",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    if (!q) return await reply("❌ Provide movie name (e.g., `movie Interstellar`)");

    try {
        await reply("🔍 Searching YTS...");
        const res = await axios.get(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}`);
        const movies = res.data.data.movies;
        if (!movies || movies.length === 0) return await reply("❌ No results found.");

        const movie = movies[0]; // top result
        const torrent = movie.torrents.find(t => t.quality === "1080p") || movie.torrents[0];
        if (!torrent || !torrent.url) return await reply("❌ No torrent link found.");

        const title = movie.title.replace(/[\\/:*?"<>|]/g, '');
        const filePath = path.join(__dirname, `${title}.mp4`);

        await reply(`🎬 *${movie.title}*\n📥 Downloading *${torrent.quality}*... Please wait.`);

        // Import WebTorrent dynamically
        const WebTorrent = (await import('webtorrent')).default;
        const client = new WebTorrent();

        client.add(torrent.url, { path: __dirname }, async torrent => {
            const file = torrent.files.find(f => f.name.endsWith('.mp4'));
            if (!file) return await reply("❌ No .mp4 file found in torrent.");

            const stream = fs.createWriteStream(filePath);
            file.createReadStream().pipe(stream);

            stream.on('finish', async () => {
                await robin.sendMessage(from, {
                    document: fs.createReadStream(filePath),
                    mimetype: 'video/mp4',
                    fileName: `${title}.mp4`,
                    caption: `🎬 *${movie.title}*\n📌 Quality: ${torrent.quality}\n✅ *Done!*`,
                    quoted: mek
                });
                fs.unlinkSync(filePath);
                client.destroy();
            });

            stream.on('error', async err => {
                console.error(err);
                await reply("❌ Failed to save file.");
                client.destroy();
            });
        });

        client.on('error', async err => {
            console.error(err);
            await reply("❌ Torrent error. Try a different movie.");
        });

    } catch (err) {
        console.error("Movie Plugin Error:", err);
        await reply("❌ Something went wrong. Try again.");
    }
});
