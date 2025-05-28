const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const SKY_API_URL = "https://api.skymansion.site/movies-dl";
const SKY_API_KEY = config.MOVIE_API_KEY;

const TMDB_API_KEY = config.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Get movie info from TMDb and download in 1080p from PixelDrain",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // Step 1: Get movie details from TMDb
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

        const caption = `🎬 *${movieTitle}*\n🗓️ Release Date: ${releaseDate}\n⭐ Rating: ${rating}/10\n\n📝 *Description:* ${movieOverview}`;

        // Send movie poster + details first
        if (moviePoster) {
            await robin.sendMessage(from, {
                image: { url: moviePoster },
                caption,
                quoted: mek
            });
        } else {
            await reply(caption);
        }

        // Step 2: Get download link from SkyMansion
        const searchUrl = `${SKY_API_URL}/search?q=${encodeURIComponent(movieTitle)}&api_key=${SKY_API_KEY}`;
        const skySearch = await fetchJson(searchUrl);

        if (!skySearch?.SearchResult?.result?.length) {
            return await reply(`❌ No download found for: *${movieTitle}*`);
        }

        const selectedMovie = skySearch.SearchResult.result[0];
        const detailsUrl = `${SKY_API_URL}/download/?id=${selectedMovie.id}&api_key=${SKY_API_KEY}`;
        const detailsResponse = await fetchJson(detailsUrl);

        if (!detailsResponse?.downloadLinks?.result?.links?.driveLinks?.length) {
            return await reply('❌ No PixelDrain download links found.');
        }

        const pixelDrainLinks = detailsResponse.downloadLinks.result.links.driveLinks;
        const selectedDownload = pixelDrainLinks.find(link => link.quality === "Full HD 1080p");

        if (!selectedDownload?.link?.startsWith('http')) {
            return await reply('❌ No valid 1080p download link available.');
        }

        const fileId = selectedDownload.link.split('/').pop();
        const directDownloadLink = `https://pixeldrain.com/api/file/${fileId}?download`;
        const filePath = path.join(__dirname, `${movieTitle}-1080p.mp4`);

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
                fileName: `${movieTitle}-1080p.mp4`,
                caption: `🎬 *${movieTitle}*\n📥 Downloaded in 1080p from PixelDrain.`,
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
