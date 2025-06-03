import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';

export async function handleTorrentDownload(sock, message, magnetLink) {
  try {
    if (!magnetLink || !magnetLink.startsWith('magnet:?xt=urn:btih:')) {
      await sock.sendMessage(message.key.remoteJid, { text: 'Please send a valid magnet link.' });
      return;
    }

    const client = new WebTorrent();

    client.add(magnetLink, { path: './downloads' }, async (torrent) => {
      await sock.sendMessage(message.key.remoteJid, { text: `Downloading: ${torrent.name}` });

      torrent.on('done', async () => {
        const file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b));
        const filePath = path.join('./downloads', file.path);

        await sock.sendMessage(message.key.remoteJid, {
          document: fs.readFileSync(filePath),
          fileName: file.name,
          mimetype: 'video/mp4',
        });

        client.destroy();
      });

      torrent.on('download', () => {
        const percent = (torrent.progress * 100).toFixed(1);
        console.log(`Progress: ${percent}%`);
      });
    });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(message.key.remoteJid, { text: 'Error downloading the torrent.' });
  }
}
