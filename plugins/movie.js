const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const TMDB_API_KEY = config.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CINEPLEX_API = "https://api.cineplex.live/api/v1/movies/search";

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Get movie info from TMDb and download from Cineplex",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // Step 1: Fetch TMDb info
        const tmdbSearchUrl = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(q)}&api_key=${TMDB_API_KEY}`;
        const tmdbResponse = await fetchJson(tmdbSearchUrl);

        if (!tmdbResponse?.results?.length) {
            return await reply(`❌ No movie found on TMDb for: *${q}*`);
        }

        const movie = tmdbResponse.results[0];
        const movieTitle = movie.title;
        const movieOverview = movie.overview || "No description available.";
        const moviePoster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        const releaseDate = movie.release_date || "Unknown";
        const rating = movie.vote_average || "N/A";

        const caption = `🎬 *${movieTitle}*\n🗓️ Release: ${releaseDate}\n⭐ Rating: ${rating}/10\n\n📝 *About:* ${movieOverview}`;

        if (moviePoster) {
            await robin.sendMessage(from, {
                image: { url: moviePoster },
                caption,
                quoted: mek
            });
        } else {
            await reply(caption);
        }

        // Step 2: Fetch direct download link from CineplexAPI
        const cineplexUrl = `${CINEPLEX_API}?q=${encodeURIComponent(movieTitle)}`;
        const cineplexRes = await fetchJson(cineplexUrl);

        if (!cineplexRes || !cineplexRes.data || !cineplexRes.data.length) {
            return await reply('❌ Movie not found on Cineplex.');
        }

        const result = cineplexRes.data[0];
        const downloadLink = result?.download || result?.url;

        if (!downloadLink || !downloadLink.startsWith('http')) {
            return await reply('❌ No valid direct download link found.');
        }

        // Step 3: Download and send movie file
        const filePath = path.join(__dirname, `${movieTitle}-1080p.mp4`);
        const writer = fs.createWriteStream(filePath);

        const { data } = await axios({
            url: downloadLink,
            method: 'GET',
            responseType: 'stream'
        });

        data.pipe(writer);

        writer.on('finish', async () => {
            await robin.sendMessage(from, {
                document: fs.readFileSync(filePath),
                mimetype: 'video/mp4',
                fileName: `${movieTitle}-1080p.mp4`,
                caption: `🎬 *${movieTitle}*\n📥 Downloaded in 1080p from Cineplex.`,
                quoted: mek
            });

            fs.unlinkSync(filePath); // Clean up
        });

        writer.on('error', async (err) => {
            console.error('Download Error:', err);
            await reply('❌ Failed to download movie. Please try again.');
        });

    } catch (error) {
        console.error('Error in movie command:', error);
        await reply('❌ Something went wrong. Please try again later.');
    }
});
