const WebTorrent = require("webtorrent");
const fs = require("fs");

module.exports = {
  pattern: "download",
  alias: [],
  react: "📥",
  desc: "Download movie from magnet link",
  category: "downloader",
  use: "<magnet_link>",
  async function(sock, m, msg, extra) {
    const { args, reply, from } = extra;
    const magnetURI = args[0];

    if (!magnetURI || !magnetURI.startsWith("magnet:?xt=")) {
      return reply("❌ Provide a valid magnet link.\nExample: !download <magnet_link>");
    }

    const client = new WebTorrent();

    reply("🔄 Starting torrent download...");

    client.add(magnetURI, { path: './downloads' }, async (torrent) => {
      torrent.on("done", async () => {
        const mp4File = torrent.files.find(file => file.name.endsWith(".mp4"));
        if (!mp4File) return reply("❌ No MP4 file found in torrent.");

        const filePath = `./downloads/${mp4File.path}`;

        // Send as document
        await sock.sendMessage(from, {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: mp4File.name,
        }, { quoted: m });

        client.destroy();
        fs.unlinkSync(filePath); // delete after sending
      });

      torrent.on("error", err => {
        console.error(err);
        reply("❌ Torrent download failed.");
        client.destroy();
      });
    });
  }
};
