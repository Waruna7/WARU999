const { cmd } = require("../command");
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
      if (!q) return reply("❌ Please provide a torrent magnet link or .torrent URL.");

      const client = new WebTorrent();

      await robin.sendMessage(from, { text: "🌀 Starting torrent download, please wait..." }, { quoted: mek });

      client.add(q, { path: "./downloads" }, (torrent) => {
        // Select the largest file in the torrent (usually the main video)
        const file = torrent.files.reduce((a, b) => (a.length > b.length ? a : b));

        const filePath = path.join("./downloads", file.name);

        // Stream the file to disk
        const stream = file.createReadStream();
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);

        torrent.on("download", () => {
          const percent = ((torrent.downloaded / torrent.length) * 100).toFixed(2);
          console.log(`Progress: ${percent}%`);
          // Optionally you could send progress to user every N%
        });

        torrent.on("done", async () => {
          console.log("Torrent download finished");

          try {
            const buffer = fs.readFileSync(filePath);

            // Check file size limit (~100MB)
            if (buffer.length > 100 * 1024 * 1024) {
              await robin.sendMessage(
                from,
                {
                  text: "❌ File is too large to send via WhatsApp (limit ~100MB).",
                },
                { quoted: mek }
              );
              // Cleanup
              fs.unlinkSync(filePath);
              client.destroy();
              return;
            }

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

            // Cleanup local file after sending
            fs.unlinkSync(filePath);
            client.destroy();
          } catch (err) {
            console.error("Error sending file:", err);
            reply("❌ Failed to send the downloaded file.");
          }
        });

        torrent.on("error", (err) => {
          console.error("Torrent error:", err);
          reply("❌ Error downloading torrent: " + err.message);
          client.destroy();
        });
      });
    } catch (error) {
      console.error(error);
      reply("❌ Error: " + error.message);
    }
  }
);
