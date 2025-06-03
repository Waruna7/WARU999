const WebTorrent = require("webtorrent");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "torrent",
    react: "🌀",
    desc: "Download video from torrent link",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, reply, q, quoted }) => {
    try {
      if (!q) return reply("Please provide a torrent magnet link or .torrent URL.");

      const client = new WebTorrent();

      // Inform user
      await robin.sendMessage(from, { text: "🌀 Starting torrent download, please wait..." }, { quoted: mek });

      client.add(q, { path: "./downloads" }, (torrent) => {
        // Select the largest file (usually the main video)
        const file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b));

        // Stream the file into a local path
        const filePath = path.join("./downloads", file.name);
        const stream = file.createReadStream();
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        torrent.on("download", () => {
          // Optional: you can send progress updates here
          const percent = (torrent.downloaded / torrent.length) * 100;
          console.log(`Progress: ${percent.toFixed(2)}%`);
        });

        torrent.on("done", async () => {
          console.log("Torrent download finished");

          // Read the downloaded file into a buffer
          const buffer = fs.readFileSync(filePath);

          // Send the file as document
          await robin.sendMessage(
            from,
            {
              document: buffer,
              mimetype: "video/mp4",
              fileName: file.name,
              caption: `🎥 Here is your torrent video: ${file.name}`,
            },
            { quoted: mek }
          );

          // Clean up
          fs.unlinkSync(filePath);
          client.destroy();
        });
      });
    } catch (error) {
      console.error(error);
      reply("❌ Error downloading torrent: " + error.message);
    }
  }
);
const WebTorrent = require('webtorrent');
const fs = require('fs');
const path = require('path');

module.exports = {
  pattern: 'download',
  desc: 'Download movie from torrent/magnet link',
  react: '⏳',
  async function (robin, mek, m, extra) {
    try {
      const { from, reply } = extra;
      const args = extra.args;

      if (!args.length) return reply('Please provide a magnet or torrent link!');

      const torrentLink = args[0];

      reply('Starting download... This may take some time depending on file size.');

      const client = new WebTorrent();

      client.add(torrentLink, { path: './downloads' }, torrent => {
        // Wait for the torrent to be ready (metadata fetched)
        torrent.on('done', async () => {
          try {
            const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.avi'));
            if (!file) {
              reply('No video file found in torrent.');
              client.destroy();
              return;
            }

            const filePath = path.join('./downloads', file.path);

            reply(`Download complete: ${file.name}\nUploading now...`);

            // Send video file via WhatsApp
            await robin.sendMessage(from, {
              document: fs.readFileSync(filePath),
              fileName: file.name,
              mimetype: 'video/mp4'
            }, { quoted: mek });

            // Clean up
            fs.unlinkSync(filePath); // delete after sending
            client.destroy();
          } catch (e) {
            reply('Error sending file: ' + e.message);
            client.destroy();
          }
        });

        // Progress notification (optional)
        torrent.on('download', bytes => {
          const progress = (torrent.progress * 100).toFixed(2);
          console.log(`Progress: ${progress}%`);
        });
      });
    } catch (error) {
      reply('Error: ' + error.message);
    }
  }
};
