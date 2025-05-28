const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_URL = "https://api.skymansion.site/movies-dl/download";
const API_KEY = config.MOVIE_API_KEY;

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Search and download movies from PixelDrain",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // Search for the movie
        const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}&api_key=${API_KEY}`;
        const response = await fetchJson(searchUrl);

        if (!response || !response.SearchResult || !response.SearchResult.result.length) {
            return await reply(`❌ No result found for *${q}*.\nTry using a different name or spelling.`);
        }

        const selectedMovie = response.SearchResult.result[0];
        const detailsUrl = `${DOWNLOAD_URL}/?id=${selectedMovie.id}&api_key=${API_KEY}`;
        const detailsResponse = await fetchJson(detailsUrl);

        if (!detailsResponse || !detailsResponse.downloadLinks || !detailsResponse.downloadLinks.result.links.driveLinks.length) {
            return await reply('❌ No PixelDrain download links found for this movie.');
        }

        const pixelDrainLinks = detailsResponse.downloadLinks.result.links.driveLinks;
        const preferredQualities = ["HD 720p", "Full HD 1080p", "SD 480p"];

        let selectedDownload = null;
        for (const quality of preferredQualities) {
            selectedDownload = pixelDrainLinks.find(link => link.quality === quality);
            if (selectedDownload) {
                await reply(`📥 Trying quality: *${quality}*`);
                break;
            }
        }

        if (!selectedDownload || !selectedDownload.link.startsWith('http')) {
            return await reply('❌ No valid download link available in 720p, 1080p, or 480p.');
        }

        // Get PixelDrain file ID
        const urlParts = selectedDownload.link.split('/');
        const fileId = urlParts.includes('file') ? urlParts[urlParts.indexOf('file') + 1] : urlParts.pop();
        const directDownloadLink = `https://pixeldrain.com/api/file/${fileId}?download`;

        const safeTitle = selectedMovie.title.replace(/[\/\\?%*:|"<>]/g, '-');
        const filePath = path.join(__dirname, `${safeTitle}-${selectedDownload.quality}.mp4`);
        const writer = fs.createWriteStream(filePath);

        const { data } = await axios({
            url: directDownloadLink,
            method: 'GET',
            responseType: 'stream'
        });

        data.pipe(writer);

        writer.on('finish', async () => {
            await robin.sendMessage(from, {
                document: fs.readFileSync(filePath),
                mimetype: 'video/mp4',
                fileName: `${safeTitle}-${selectedDownload.quality}.mp4`,
                caption: `🎬 *${selectedMovie.title}*\n📌 Quality: ${selectedDownload.quality}\n✅ *Download Complete!*`,
                quoted: mek 
            });
            fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
            console.error('Download Error:', err);
            await reply('❌ Failed to download movie. Please try again.');
        });
    } catch (error) {
        console.error('Error in movie command:', error);
        await reply('❌ Something went wrong. Try again later or with a different movie name.');
    }
});
