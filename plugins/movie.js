const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const WebTorrent = require('webtorrent');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "movie",
    alias: ["ytsdl", "torrentdl"],
    react: '🎬',
    category: "download",
    desc: "Download movies using YTS (Torrent)",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a movie name.");

        const searchUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}`;
        const searchRes = await fetchJson(searchUrl);

        if (!searchRes.data.movies || searchRes.data.movies.length === 0)
            return await reply("❌ No results found.");

        const movie = searchRes.data.movies[0];
        const title = movie.title;
        const torrent = movie.torrents.find(t => t.quality === "1080p") || movie.torrents[0];

        const magnet = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(title)}&tr=udp://tracker.openbittorrent.com:80`;

        await reply(`🎬 *${title}*\n📥 Downloading 1080p via torrent...`);

        const client = new WebTorrent();
        const downloadPath = path.join(__dirname, `${title.replace(/[<>:"/\\|?*]+/g, '')}.mp4`);

        client.add(magnet, { path: __dirname }, async torrent => {
            const file = torrent.files.find(f => f.name.endsWith('.mp4'));

            file.createReadStream().pipe(fs.createWriteStream(downloadPath));

            torrent.on('done', async () => {
                await robin.sendMessage(from, {
                    document: fs.createReadStream(downloadPath),
                    mimetype: 'video/mp4',
                    fileName: `${title}.mp4`,
                    caption: `🎬 *${title}*\n✅ *Download Complete!*`,
                    quoted: mek
                });

                fs.unlinkSync(downloadPath);
                client.destroy();
            });
        });

    } catch (err) {
        console.error("YTS Download Error:", err);
        await reply("❌ Something went wrong.");
    }
});
