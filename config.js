const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}
module.exports = {
  SESSION_ID: process.env.SESSION_ID || "O85Bwb6I#S-2fy3ByEibMQLIwP0KOwIUMI4VBzkp4-5ymx-LUTfs",
  OWNER_NUM: process.env.OWNER_NUM || "94724210755",
  PREFIX: process.env.PREFIX || ".",
  ALIVE_IMG: process.env.ALIVE_IMG || "https://raw.githubusercontent.com/Waruna7/bot-help2/refs/heads/main/ChatGPT%20Image%20May%2016%2C%202025%2C%2011_52_58%20AM.png",
  ALIVE_MSG: process.env.ALIVE_MSG || "Hello , I am alive now!!\n\n🥶𝐌𝐚𝐝𝐞 𝐛𝐲 W_A_R_U_9_9_9🥶",
  MODE: process.env.MODE || "public",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyA9Tpn31BujI0-GUaMgqUmJqBK9XWBEYmA",
  MOVIE_API_KEY: process.env.MOVIE_API_KEY || "sky|bfc07870633518de653fc608e775a88f39037522",
  TMDB_API_KEY: process.env.TMDB_API_KEY || "2619480e652a7d92e47cef44c27e96b5"
};
