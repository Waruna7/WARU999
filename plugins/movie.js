const fs = require("fs");
const path = require("path");

module.exports = {
  pattern: "download",
  alias: [],
  desc: "Download movie from magnet link (MP4 only)",
  category: "downloader",
  use: "<magnet_link>",
  react: "🎥",
  
  async function(sock, m, msg, extra) {
    const { args, reply, from } = extra;

    if (!args[0] || !args[0].startsWith("magnet:?xt=")) {
      return reply("❌ Provide a valid magnet link.\n\nExample:\n.download <magnet_link>");
    }

    const magnet = args[0];

    reply("⏳ Downloading torrent...\nPlease wait, this may take a few minutes.");

    // Dynamically import ESM module
    const { default: WebTorrent } = await import("webtorrent");

    const client = new WebTorrent();

    const downloadPath = path.join(__dirname, "..", "downloads");
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    client.add(magnet, { path: downloadPath }, async (torrent) => {
      const mp4File = torrent.files.find(f => f.name.endsWith(".mp4"));
      if (!mp4File) {
        client.destroy();
        return reply("❌ No .mp4 file found in this torrent.");
      }

      const savePath = path.join(downloadPath, mp4File.path);

      reply(`📥 Downloading: ${mp4File.name}`);

      mp4File.getBuffer(async (err, buffer) => {
        if (err) {
          client.destroy();
          return reply("❌ Error reading file.");
        }

        // Save temporarily
        fs.writeFileSync(savePath, buffer);

        await sock.sendMessage(from, {
          document: fs.readFileSync(savePath),
          mimetype: "video/mp4",
          fileName: mp4File.name,
        }, { quoted: m });

        // Clean up
        fs.unlinkSync(savePath);
        client.destroy();
      });
    });

    client.on("error", (err) => {
      console.error(err);
      reply("❌ Torrent download failed.");
      client.destroy();
    });
  }
};
