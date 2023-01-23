const { Client, Collection, EmbedBuilder } = require("discord.js");

const client = new Discord.Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
  partials: ["Channel", "Reaction", "Message"],
  restTimeOffset: 0,
  allowedMentions: {
    parse: ["roles", "users"],
    repliedUser: false,
  },
});

let errChannel = "Your logs channel id";

module.exports = client;
client.commands = new Collection();
client.slashCommands = new Collection();
client.emo = require("./emojis");
client.developer = ["Your discord user ID"];

require("./handler")(client);

let toJSON = require("@stdlib/error-to-json");
process.on("unhandledRejection", (reason, p) => {
  let error = toJSON(reason);
  console.log(reason);
  let embed = new EmbedBuilder()
    .setAuthor({
      name: `${error.name}`,
      iconURL: client.user.displayAvatarURL({
        dynamic: true,
      }),
    })
    .setTitle(`unhandledRejection`)
    .setDescription(`\`\`\`js\n${trim(error.stack, 2045)}\n\`\`\``)
    .addFields(
      {
        name: "Reason",
        value: `\`\`\`cs\n#${trim(error.message, 506)}\n(code: ${trim(
          error.code,
          506
        )})\n\`\`\``,
        inline: true,
      },
      {
        name: "Path",
        value: `\`\`\`bash\n#${trim(error.path, 1018)}\n\`\`\``,
        inline: true,
      }
    )
    .setTimestamp()
    .setColor("#6F8FAF")
    .setFooter({
      text: `httpStatus: ${error.httpStatus}`,
    });
  errChannel.send({
    embeds: [embed],
  });
});

process.on("uncaughtException", (err, origin) => {
  console.log(err, origin);
  let embed = new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username} Error Catcher`,
      iconURL: client.user.displayAvatarURL({
        dynamic: true,
      }),
    })
    .setTitle(`uncaughtException`)
    .addFields({
      name: "Error",
      value: `\`\`\`js\n${trim(err, 1018)}\n\`\`\``,
    })
    .setTimestamp()
    .setColor("#6F8FAF")
    .setFooter({
      text: `[ AntiCrash ]`,
    });
  errChannel.send({
    embeds: [embed],
  });
});

process.on("multipleResolves", (type, promise, reason) => {
  console.log(type, promise, reason);
  let embed = new EmbedBuilder()
    .setAuthor({
      name: `${client.user.username} Error Catcher`,
      iconURL: client.user.displayAvatarURL({
        dynamic: true,
      }),
    })
    .setTitle(`uncaughtException`)
    .addFields(
      {
        name: "Reason",
        value: `\`\`\`js\n${trim(reason, 1018)}\n\`\`\``,
      },
      {
        name: "Type",
        value: `\`\`\`js\n${trim(type, 1018)}\n\`\`\``,
      }
    )
    .setTimestamp()
    .setColor("#6F8FAF")
    .setFooter({
      text: `[ AntiCrash ]`,
    });
  errChannel.send({
    embeds: [embed],
  });
});

function trim(str, max) {
  if (!str) str = "No output recived.";
  return str?.length > max ? `${str?.slice(0, max - 3)}...` : str;
}

client.login("Your Bot Token");
