const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_URL = "https://api.skymansion.site/movies-dl/download";
const SKY_API_KEY = config.MOVIE_API_KEY;
const TMDB_API_KEY = config.TMDB_API_KEY;

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

        // Search Skymansion API
        const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}&api_key=${SKY_API_KEY}`;
        const response = await fetchJson(searchUrl);
        if (!response || !response.SearchResult || !response.SearchResult.result.length) {
            return await reply(`❌ No results found for: *${q}*`);
        }

        const selectedMovie = response.SearchResult.result[0];

        // Search TMDb
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(selectedMovie.title)}&api_key=${TMDB_API_KEY}`;
        const tmdbSearch = await axios.get(tmdbSearchUrl);
        const movie = tmdbSearch.data.results?.[0];

        // Format details
        let detailsText = `🎬 *${selectedMovie.title}*`;
        if (movie) {
            const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
            detailsText += `\n📅 Year: ${movie.release_date?.split('-')[0] || 'N/A'}`;
            detailsText += `\n⭐ Rating: ${movie.vote_average}/10`;
            detailsText += `\n🗒️ Overview: ${movie.overview || 'No overview found.'}`;
            
            // Send poster + info first
            if (poster) {
                await robin.sendMessage(from, {
                    image: { url: poster },
                    caption: detailsText,
                    quoted: mek
                });
            } else {
                await reply(detailsText);
            }
        } else {
            await reply(detailsText);
        }

        // Download link from Skymansion
        const detailsUrl = `${DOWNLOAD_URL}/?id=${selectedMovie.id}&api_key=${SKY_API_KEY}`;
        const detailsResponse = await fetchJson(detailsUrl);
        const pixelDrainLinks = detailsResponse.downloadLinks?.result?.links?.driveLinks;

        if (!pixelDrainLinks?.length) {
            return await reply('❌ No PixelDrain download links found.');
        }

        const selectedDownload = pixelDrainLinks.find(link => link.quality === "HD 720p");
        if (!selectedDownload || !selectedDownload.link.startsWith('http')) {
            return await reply('❌ No valid 720p PixelDrain link available.');
        }

        const fileId = selectedDownload.link.split('/').pop();
        const directDownloadLink = `https://pixeldrain.com/api/file/${fileId}?download`;
        const filePath = path.join(__dirname, `${selectedMovie.title}-720p.mp4`);
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
                fileName: `${selectedMovie.title}-720p.mp4`,
                caption: `🎬 *${selectedMovie.title}*\n📌 Quality: 720p\n✅ *Download Complete!*`,
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
        await reply('❌ Something went wrong. Try again later.');
    }
});
