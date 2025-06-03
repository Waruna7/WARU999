// torrentPlugin.js (ESM version)
import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';

/**
 * Handle !download <magnet> command
 */
export async function handleTorrentDownload(sock, message, magnetLink) {
  try {
    if (!magnetLink || !magnetLink.startsWith('magnet:?xt=urn:btih:')) {
      await sock.sendMessage(message.key.remoteJid, { text: '❌ Please send a valid magnet link.' });
      return;
    }

    const client = new WebTorrent();

    client.add(magnetLink, { path: './downloads' }, async (torrent) => {
      await sock.sendMessage(message.key.remoteJid, { text: `⏳ Downloading: *${torrent.name}*` });

      torrent.on('done', async () => {
        console.log('✅ Torrent download finished.');

        // Get largest file (usually the movie)
        const file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b));
        const filePath = path.join('./downloads', file.path);

        // Optional: check file size
        const stats = fs.statSync(filePath);
        const maxSizeMB = 1500; // WhatsApp limit is around 2GB; use less to be safe
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB > maxSizeMB) {
          await sock.sendMessage(message.key.remoteJid, { text: `⚠️ File too large to send: ${fileSizeMB.toFixed(2)} MB` });
        } else {
          await sock.sendMessage(message.key.remoteJid, {
            document: fs.readFileSync(filePath),
            fileName: file.name,
            mimetype: 'video/mp4',
          });
        }

        client.destroy();
      });

      // Optional download progress logging
      torrent.on('download', () => {
        const percent = (torrent.progress * 100).toFixed(1);
        console.log(`⬇️ Progress: ${percent}%`);
      });
    });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(message.key.remoteJid, { text: '❌ Error downloading torrent.' });
  }
}
