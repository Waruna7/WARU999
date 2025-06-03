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
