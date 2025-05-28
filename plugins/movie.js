const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://moviestb.com/api/search"; // Replace with real endpoint
const DOWNLOAD_URL = "https://moviestb.com/api/download"; // Replace with real endpoint

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Search and download movies from MovieSTB",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // Search for movie
        const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}`;
        const response = await fetchJson(searchUrl);

        if (!response || !response.results || !response.results.length) {
            return await reply(`❌ No results found for: *${q}*`);
        }

        const selectedMovie = response.results[0];
        const detailsUrl = `${DOWNLOAD_URL}?id=${selectedMovie.id}`;
        const detailsResponse = await fetchJson(detailsUrl);

        if (!detailsResponse || !detailsResponse.downloads || !detailsResponse.downloads.length) {
            return await reply('❌ No MovieSTB download links found.');
        }

        // Try to get 1080p, fallback to 720p or 480p
        const downloadLinks = detailsResponse.downloads;
        let selectedDownload =
            downloadLinks.find(link => link.quality === "1080p") ||
            downloadLinks.find(link => link.quality === "720p") ||
            downloadLinks.find(link => link.quality === "480p");

        if (!selectedDownload || !selectedDownload.url.startsWith('http')) {
            return await reply('❌ No valid download link available.');
        }

        // Notify user
        await reply(`🎬 *${selectedMovie.title}*\n📥 Downloading in *${selectedDownload.quality}*...`);

        // Sanitize filename
        const safeTitle = selectedMovie.title.replace(/[<>:"/\\|?*]+/g, '');
        const filePath = path.join(__dirname, `${safeTitle}-${selectedDownload.quality}.mp4`);

        // Start download
        const { data } = await axios({
            url: selectedDownload.url,
            method: 'GET',
            responseType: 'stream',
            timeout: 60000
        });

        const writer = fs.createWriteStream(filePath);
        data.pipe(writer);

        writer.on('finish', async () => {
            await robin.sendMessage(from, {
                document: fs.createReadStream(filePath),
                mimetype: 'video/mp4',
                fileName: `${safeTitle}-${selectedDownload.quality}.mp4`,
                caption: `🎬 *${selectedMovie.title}*\n📌 Quality: ${selectedDownload.quality}\n✅ *Download Complete!*`,
                quoted: mek
            });

            fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
            console.error('Writer Error:', err);
            await reply('❌ Failed to download the movie. Please try again later.');
        });

    } catch (error) {
        console.error('Error in movie command:', error);
        await reply('❌ Sorry, something went wrong. Please try again later.');
    }
});
