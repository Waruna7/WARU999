const WebTorrent = require('webtorrent');
const fs = require('fs');
const path = require('path');

async function handleTorrentDownload(sock, message, magnetLink) {
  try {
    if (!magnetLink || !magnetLink.startsWith('magnet:?xt=urn:btih:')) {
      await sock.sendMessage(message.key.remoteJid, { text: 'Please send a valid magnet link.' });
      return;
    }

    const client = new WebTorrent();

    client.add(magnetLink, { path: './downloads' }, async (torrent) => {
      await sock.sendMessage(message.key.remoteJid, { text: `Downloading: ${torrent.name}` });

      torrent.on('done', async () => {
        console.log('Download finished');

        // Find largest file (usually the movie)
        const file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b));

        const filePath = path.join('./downloads', file.path);

        // Send file to WhatsApp user
        await sock.sendMessage(message.key.remoteJid, {
          document: fs.readFileSync(filePath),
          fileName: file.name,
          mimetype: 'video/mp4',
        });

        client.destroy();
      });

      torrent.on('download', (bytes) => {
        const percent = (torrent.progress * 100).toFixed(1);
        console.log(`Progress: ${percent}%`);
        // Optional: send progress message every X seconds or %
      });
    });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(message.key.remoteJid, { text: 'Error downloading the torrent.' });
  }
}

// Inside your message handler
async function onMessage(sock, message) {
  try {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

    if (!text) return;

    if (text.startsWith('!download ')) {
      const magnetLink = text.split(' ')[1];
      await handleTorrentDownload(sock, message, magnetLink);
    }

    // Your other message handling code...

  } catch (e) {
    console.error(e);
  }
}
