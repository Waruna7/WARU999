const { cmd } = require('../command');
const axios = require('axios');
const WebTorrent = require('webtorrent');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Download movies from YTS via torrent",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Provide a movie name!');

        // Search movie on YTS
        const search = await axios.get(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}`);
        const movies = search.data.data.movies;
        if (!movies || movies.length === 0) return await reply(`❌ No results for: *${q}*`);

        const movie = movies[0]; // pick first result
        const torrent = movie.torrents.find(t => t.quality === "1080p") || movie.torrents[0];
        if (!torrent || !torrent.url) return await reply('❌ No suitable torrent found.');

        await reply(`🎬 *${movie.title_long}*\n📥 Downloading *${torrent.quality}* via torrent...`);

        // Start torrent
        const client = new WebTorrent();
        client.add(torrent.url, { path: './downloads' }, async torrent => {
            const file = torrent.files.find(f => f.name.endsWith('.mp4')) || torrent.files[0];
            const filePath = path.join('./downloads', file.path);

            const writeStream = fs.createWriteStream(filePath);
            const readStream = file.createReadStream();
            readStream.pipe(writeStream);

            writeStream.on('finish', async () => {
                try {
                    if (!fs.existsSync(filePath)) {
                        await reply("❌ File not found after download.");
                        return;
                    }

                    const stream = fs.createReadStream(filePath);
                    stream.on('error', async err => {
                        console.error('Stream Error:', err);
                        await reply('❌ Error reading file.');
                    });

                    await robin.sendMessage(from, {
                        document: stream,
                        mimetype: 'video/mp4',
                        fileName: file.name,
                        caption: `🎬 *${movie.title_long}*\n✅ Download complete (${torrent.quality})`,
                        quoted: mek
                    });

                    fs.unlinkSync(filePath); // delete file
                    client.destroy(); // cleanup
                } catch (err) {
                    console.error('Send Error:', err);
                    await reply('❌ Error sending movie.');
                }
            });

            writeStream.on('error', async err => {
                console.error('Write Error:', err);
                await reply('❌ Failed to save file.');
            });
        });

    } catch (err) {
        console.error('Movie Error:', err);
        await reply('❌ Something went wrong.');
    }
});
const { cmd } = require('../command');
const axios = require('axios');
const WebTorrent = require('webtorrent');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Download movies from YTS via torrent",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Provide a movie name!');

        // Search movie on YTS
        const search = await axios.get(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}`);
        const movies = search.data.data.movies;
        if (!movies || movies.length === 0) return await reply(`❌ No results for: *${q}*`);

        const movie = movies[0]; // pick first result
        const torrent = movie.torrents.find(t => t.quality === "1080p") || movie.torrents[0];
        if (!torrent || !torrent.url) return await reply('❌ No suitable torrent found.');

        await reply(`🎬 *${movie.title_long}*\n📥 Downloading *${torrent.quality}* via torrent...`);

        // Start torrent
        const client = new WebTorrent();
        client.add(torrent.url, { path: './downloads' }, async torrent => {
            const file = torrent.files.find(f => f.name.endsWith('.mp4')) || torrent.files[0];
            const filePath = path.join('./downloads', file.path);

            const writeStream = fs.createWriteStream(filePath);
            const readStream = file.createReadStream();
            readStream.pipe(writeStream);

            writeStream.on('finish', async () => {
                try {
                    if (!fs.existsSync(filePath)) {
                        await reply("❌ File not found after download.");
                        return;
                    }

                    const stream = fs.createReadStream(filePath);
                    stream.on('error', async err => {
                        console.error('Stream Error:', err);
                        await reply('❌ Error reading file.');
                    });

                    await robin.sendMessage(from, {
                        document: stream,
                        mimetype: 'video/mp4',
                        fileName: file.name,
                        caption: `🎬 *${movie.title_long}*\n✅ Download complete (${torrent.quality})`,
                        quoted: mek
                    });

                    fs.unlinkSync(filePath); // delete file
                    client.destroy(); // cleanup
                } catch (err) {
                    console.error('Send Error:', err);
                    await reply('❌ Error sending movie.');
                }
            });

            writeStream.on('error', async err => {
                console.error('Write Error:', err);
                await reply('❌ Failed to save file.');
            });
        });

    } catch (err) {
        console.error('Movie Error:', err);
        await reply('❌ Something went wrong.');
    }
});
