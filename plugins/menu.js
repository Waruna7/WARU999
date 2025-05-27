const { cmd, commands } = require("../command");
const config = require('../config');
cmd(
  {
    pattern: "menu",
    alise: ["getmenu"],
    react: "🤖",
    desc: "get cmd list",
    category: "main",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {      
      let menu = {
        main: "",
        download: "",
        group: "",
        owner: "",
        convert: "",
        search: "",
      };

      for (let i = 0; i < commands.length; i++) {
        if (commands[i].pattern && !commands[i].dontAddCommandList) {
          menu[
            commands[i].category
          ] += `${config.PREFIX}${commands[i].pattern}\n`;
        }
      }

      let madeMenu = `👋 *Hello  ${pushname}*


| *MAIN COMMANDS* |
    ~.alive
    ~.menu
| *DOWNLOAD COMMANDS* | 
    ~.video
    ~.music
    ~.movie
    
🥶𝐌𝐚𝐝𝐞 𝐛𝐲 W_A_R_U_9_9_9🥶

> ROBIN MENU MSG
`;
      await robin.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/Waruna7/bot-help2/refs/heads/main/ChatGPT%20Image%20May%2016%2C%202025%2C%2011_52_58%20AM.png",
          },
          caption: madeMenu,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.log(e);
      reply(`${e}`);
    }
  }
);
