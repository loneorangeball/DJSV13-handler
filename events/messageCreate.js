const client = require("../index");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  Permissions,
} = require("discord.js");
const cooldownSchema = require("../models/cooldown");
const prettyMilliseconds = require("pretty-ms");
const owners_id = client.developer;
const prefix = require("../models/prefix");

client.prefix = async function (message) {
  let custom;
  const data = await prefix
    .findOne({
      Guild: message.guildId,
    })
    .catch((err) => console.log(err));
  if (data) {
    custom = data.Prefix;
  }
  if (!data) {
    const prefix = "$";
    custom = prefix;
  }
  return custom;
};

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  const p = await client.prefix(message);
  const mentionRegex = new RegExp(`^<@!?${client.user.id}>( |)$`);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Invite Me")
      .setStyle("LINK")
      .setURL(
        "https://discord.com/api/oauth2/authorize?client_id=870413726711435297&permissions=1103203134710&scope=bot%20applications.commands"
      ),
    new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle("LINK")
      .setURL("https://discord.gg/j3YamACwPu")
  );
  if (message.content.match(mentionRegex)) {
    const embed = new EmbedBuilder()
      .setDescription(
        `**Hey ${message.author.username}, My prefix is \`${p}\` If you need any help you can join the support server.**`
      )
      .setColor("#6F8FAF");
    message
      .reply({
        embeds: [embed],
        components: [row],
      })
      .catch((err) => {});
  }
  if (!message.content.startsWith(p)) return;
  if (message.author.bot) return;
  if (!message.member)
    message.member = await message.guild.fetchMember(message);
  const args = message.content.slice(p.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();
  if (cmd.length == 0) return;
  const command =
    client.commands.get(cmd.toLowerCase()) ||
    client.commands.find((c) => c.aliases?.includes(cmd.toLowerCase()));

  if (!command) return;

  if (command?.owner === true && !owners_id.includes(message.author.id)) return;

  if (command) {
    if (
      !message.guild.me
        .permissionsIn(message.channel)
        .has("SEND_MESSAGES", "EMBED_LINKS")
    )
      return;

    if (!message.member.permissions.has(command.userPerms || [])) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Missing Permisssion")
            .setDescription(
              "My apologies but you do not have the required permissions to run this command."
            )
            .addField(
              "Required Permissions",
              `\`\`\`${cmd.userPerms
                .map((perm) => nicerPermissions(perm))
                .join("\n")}\`\`\``
            )
            .setColor("#6F8FAF"),
        ],
        ephemeral: true,
      });
    }

    if (!message.guild.me.permissions.has(command.botPerms || [])) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Missing Permisssion")
            .setDescription(
              "My apologies but I do not have the required permissions to run this command."
            )
            .addField(
              "Required Permissions",
              `\`\`\`${cmd.botPerms
                .map((perm) => nicerPermissions(perm))
                .join("\n")}\`\`\``
            )
            .setColor("#6F8FAF"),
        ],
        ephemeral: true,
      });
    }

    if (message.content.length > command.msgLimit) {
      let limit = new EmbedBuilder()
        .setDescription(
          `My apologies please keep the message content under ${command.msgLimit} characters.`
        )
        .setColor("#6F8FAF");
      return message.reply({
        embeds: [limit],
      });
    } else {
      if (command.timeout) {
        let cooldown;
        try {
          cooldown = await cooldownSchema.findOne({
            userID: message.author.id,
            commandName: command.name,
          });
          if (!cooldown) {
            cooldown = await cooldownSchema.create({
              userID: message.author.id,
              commandName: command.name,
              cooldown: 0,
            });
            cooldown.save();
          }
        } catch (e) {
          console.error(e);
        }

        if (
          !cooldown ||
          command.timeout * 1000 - (Date.now() - cooldown.cooldown) > 0
        ) {
          let timecommand = prettyMilliseconds(command.timeout * 1000, {
            verbose: true,
            verbose: true,
          });

          const timeleft = prettyMilliseconds(
            command.timeout * 1000 - (Date.now() - cooldown.cooldown),
            {
              verbose: true,
            }
          );

          let cooldownMessage = command.cooldownMsg
            ? command.cooldownMsg.description
            : `My Apologies But You Can Only Use This Command Every **${timecommand}**!\n> Try Again In: **${timeleft}** `;

          let cooldownMsg = cooldownMessage
            .replace("[timeleft]", `${timeleft}`)
            .replace("[cooldown]", `${timecommand}`)
            .replace("[user]", `${message.author.username}`);

          let cooldownEmbed = new EmbedBuilder()
            .setTitle(
              `${
                command.cooldownMsg ? command.cooldownMsg.title : "Slow Down!"
              }`
            )
            .setDescription(cooldownMsg)
            .setColor(
              `${command.cooldownMsg ? command.cooldownMsg.color : "#6F8FAF"}`
            );
          //return message.reply({embeds: [cooldownEmbed]})
          return message.react("⏳");
        } else {
          command.run(client, message, args);
          await cooldownSchema.findOneAndUpdate(
            {
              userID: message.author.id,
              commandName: command.name,
            },
            {
              cooldown: Date.now(),
            }
          );
        }
      } else {
        command.run(client, message, args);
      }
    }
  }
});

function nicerPermissions(permissionString) {
  return permissionString
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
