const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_URL = "https://api.skymansion.site/movies-dl/download";
const API_KEY = config.MOVIE_API_KEY;
const TMDB_API_KEY = config.TMDB_API_KEY;

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Search and download movies (HD 720p)",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // 🔍 Search TMDb for movie info
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
        const tmdbRes = await fetchJson(tmdbSearchUrl);

        if (!tmdbRes.results || tmdbRes.results.length === 0) {
            return await reply('❌ Movie not found in TMDb.');
        }

        const movie = tmdbRes.results[0];
        const title = movie.title;
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
        const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        const overview = movie.overview || 'No description available.';
        const tmdbId = movie.id;

        // 🎬 Fetch extra details like runtime, genres, rating
        const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
        const movieDetails = await fetchJson(detailsUrl);

        const duration = movieDetails.runtime ? `${movieDetails.runtime} min` : 'N/A';
        const genres = movieDetails.genres ? movieDetails.genres.map(g => g.name).join(', ') : 'N/A';
        const rating = movieDetails.vote_average || 'N/A';

        // Send thumbnail and info first
        const movieInfo = `🎬 *${title} (${year})*
🕰 Duration: ${duration}
🌐 Genre: ${genres}
⭐ Rating: ${rating}
📝 ${overview}
📥 Quality: 720p
\nDownloading now...`;

        if (posterUrl) {
            await robin.sendMessage(from, {
                image: { url: posterUrl },
                caption: movieInfo,
                quoted: mek
            });
        } else {
            await reply(movieInfo);
        }

        // Now use your original search to get download link
        const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}&api_key=${API_KEY}`;
        const response = await fetchJson(searchUrl);

        if (!response || !response.SearchResult || !response.SearchResult.result.length) {
            return await reply(`❌ No downloadable link found for: *${q}*`);
        }

        const selectedMovie = response.SearchResult.result[0];
        const downloadDetailsUrl = `${DOWNLOAD_URL}/?id=${selectedMovie.id}&api_key=${API_KEY}`;
        const downloadDetails = await fetchJson(downloadDetailsUrl);

        const pixelDrainLinks = downloadDetails.downloadLinks.result.links.driveLinks;
        const selectedDownload = pixelDrainLinks.find(link => link.quality === "HD 720p");

        if (!selectedDownload || !selectedDownload.link.startsWith('http')) {
            return await reply('❌ No valid 720p PixelDrain link available.');
        }

        const fileId = selectedDownload.link.split('/').pop();
        const directDownloadLink = `https://pixeldrain.com/api/file/${fileId}?download`;

        // Download
        const safeTitle = title.replace(/[<>:"/\\|?*]+/g, '');
        const filePath = path.join(__dirname, `${safeTitle}-720p.mp4`);
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
                fileName: `${safeTitle}-720p.mp4`,
                caption: `🎬 *${title}*\n📌 Quality: 720p\n✅ *Download Complete!*`,
                quoted: mek
            });
            fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
            console.error('Download Error:', err);
            await reply('❌ Failed to download movie. Please try again.');
        });

    } catch (error) {
        console.error('Movie command error:', error);
        await reply('❌ Something went wrong.');
    }
});
