require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  ActivityType,
  SlashCommandBuilder,
  ChannelType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

const PREFIX = "!";
const BOT_NAME = "Cubixorasmp";

const MC_IP = "cubixorasmp.play.hosting";
const MC_JAVA_PORT = "25565";
const MC_BEDROCK_PORT = "19132";

const config = new Map();
const owners = new Map();
const wordGames = new Map();

function getConfig(guildId) {
  if (!config.has(guildId)) {
    config.set(guildId, {
      welcomeChannel: null,
      goodbyeChannel: null,
      wordChannel: null
    });
  }
  return config.get(guildId);
}

function hasAdmin(member) {
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.id === member.guild.ownerId ||
    (owners.get(member.guild.id) || []).includes(member.id)
  );
}

function parseDuration(text) {
  if (!text) return null;

  const match = text.toLowerCase().match(/^(\d+)(s|sn|m|dk|h|sa|d|g|ay)$/);
  if (!match) return null;

  const number = Number(match[1]);
  const unit = match[2];
  const map = {
    s: 1000,
    sn: 1000,
    m: 60 * 1000,
    dk: 60 * 1000,
    h: 60 * 60 * 1000,
    sa: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    g: 24 * 60 * 60 * 1000,
    ay: 30 * 24 * 60 * 60 * 1000
  };

  return number * (map[unit] || 1000);
}

function durationText(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds < 60) return `${totalSeconds} saniye`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)} dakika`;
  if (totalSeconds < 86400) return `${Math.floor(totalSeconds / 3600)} saat`;
  if (totalSeconds < 2592000) return `${Math.floor(totalSeconds / 86400)} gün`;

  return `${Math.floor(totalSeconds / 2592000)} ay`;
}

async function muteMember(member, duration, reason, moderator = null) {
  if (!member || !member.moderatable) return false;

  try {
    await member.timeout(duration, reason || "Sebep belirtilmedi");
    return true;
  } catch {
    return false;
  }
}

const slashCommands = [
  new SlashCommandBuilder()
    .setName("ip")
    .setDescription("Sunucu IP bilgilerini gösterir"),

  new SlashCommandBuilder()
    .setName("kelime-kanal")
    .setDescription("Kelime oyunu kanalını ayarlar")
    .addChannelOption(option =>
      option
        .setName("kanal")
        .setDescription("Kelime oyunu kanalı")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("hosgeldin-kanal")
    .setDescription("Hoşgeldin kanalını ayarlar")
    .addChannelOption(option =>
      option
        .setName("kanal")
        .setDescription("Hoşgeldin kanalı")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("gulegule-kanal")
    .setDescription("Güle güle kanalını ayarlar")
    .addChannelOption(option =>
      option
        .setName("kanal")
        .setDescription("Güle güle kanalı")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
];

client.once("ready", async () => {
  console.log(`${BOT_NAME} giriş yaptı.`);

  client.user.setPresence({
    activities: [
      {
        name: "CubixoraSMP | !ip",
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });

  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(slashCommands.map(cmd => cmd.toJSON()));
    } catch (err) {
      console.log("Slash komut yükleme hatası:", err.message);
    }
  }
});

client.on("guildMemberAdd", async member => {
  const settings = getConfig(member.guild.id);

  if (!settings.welcomeChannel) return;

  const channel = member.guild.channels.cache.get(settings.welcomeChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("👋 Hoş Geldin!")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `**${member.user.tag}** sunucumuza hoş geldin!\n\n` +
      `Toplam üye: **${member.guild.memberCount}**`
    )
    .setFooter({ text: `${BOT_NAME} • Hoşgeldin` })
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

client.on("guildMemberRemove", async member => {
  const settings = getConfig(member.guild.id);

  if (!settings.goodbyeChannel) return;

  const channel = member.guild.channels.cache.get(settings.goodbyeChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("👋 Güle Güle!")
    .setDescription(
      `**${member.user.tag}** sunucudan ayrıldı.\n\n` +
      `Kalan üye: **${member.guild.memberCount}**`
    )
    .setFooter({ text: `${BOT_NAME} • Güle Güle` })
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const settings = getConfig(message.guild.id);
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Selamlaşma
  if (["sa", "s.a", "selam", "selamün aleyküm", "selamun aleykum"].includes(lower)) {
    return message.reply("Aleyküm Selam, hoş geldin! 👋");
  }

  // Kelime oyunu
  if (settings.wordChannel === message.channel.id) {
    if (!wordGames.has(message.guild.id)) {
      wordGames.set(message.guild.id, {
        lastWord: "minecraft",
        lastUser: null
      });
    }

    const game = wordGames.get(message.guild.id);
    const word = lower.replace(/[^a-zçğıöşü]/gi, "");

    if (!word) {
      await message.delete().catch(() => {});
      return;
    }

    if (game.lastUser === message.author.id) {
      await message.delete().catch(() => {});
      return;
    }

    if (word.length < 2 || word[0] !== game.lastWord.slice(-1).toLowerCase()) {
      await message.delete().catch(() => {});
      return;
    }

    game.lastWord = word;
    game.lastUser = message.author.id;

    await message.react("✅").catch(() => {});
    return;
  }

  // Prefix komutları
  if (!content.startsWith(PREFIX)) return;

  const args = content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "yardim") {
    return message.reply(
      "Komutlar:\n" +
      "`!ip`\n" +
      "`!mute @kullanıcı 30m sebep`\n" +
      "`!unmute @kullanıcı`\n" +
      "`!ban @kullanıcı sebep`\n" +
      "`!kick @kullanıcı sebep`\n" +
      "`!owner-ekle @kullanıcı`\n" +
      "`!owner-cikar @kullanıcı`\n" +
      "`!owner-list`\n" +
      "`!kelime-kanal #kanal`"
    );
  }

  if (command === "ip") {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🌍 CubixoraSMP IP Bilgisi")
      .setDescription("Sunucumuza katılmak için aşağıdaki bilgileri kullanabilirsin.")
      .addFields(
        {
          name: "☕ Java Edition",
          value:
            `IP: \`${MC_IP}\`\n` +
            `Port: \`${MC_JAVA_PORT}\`\n` +
            `Versiyon: \`1.16.5 - 1.26.2\``
        },
        {
          name: "📱 Bedrock Edition",
          value:
            `IP: \`${MC_IP}\`\n` +
            `Port: \`${MC_BEDROCK_PORT}\`\n` +
            `Versiyon: \`1.26+\``
        }
      )
      .setFooter({ text: `${BOT_NAME} • Minecraft Sunucu` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  if (command === "kelime-kanal") {
    if (!hasAdmin(message.member)) {
      return message.reply("Bu komutu kullanmak için yetkin yok.");
    }

    const target = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]?.replace(/[<#>]/g, "") || "");
    if (!target) {
      return message.reply("Kullanım: `!kelime-kanal #kanal`");
    }

    settings.wordChannel = target.id;
    return message.reply(`✅ Kelime oyunu kanalı ${target} olarak ayarlandı.`);
  }

  if (command === "owner-ekle") {
    if (!hasAdmin(message.member)) {
      return message.reply("Bu komutu kullanmak için yetkin yok.");
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply("Kullanım: `!owner-ekle @kullanıcı`");
    }

    const list = owners.get(message.guild.id) || [];
    if (!list.includes(target.id)) {
      list.push(target.id);
      owners.set(message.guild.id, list);
    }

    return message.reply(`✅ ${target} owner listesine eklendi.`);
  }

  if (command === "owner-cikar" || command === "owner-çıkar") {
    if (!hasAdmin(message.member)) {
      return message.reply("Bu komutu kullanmak için yetkin yok.");
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply("Kullanım: `!owner-cikar @kullanıcı`");
    }

    const list = owners.get(message.guild.id) || [];
    const newList = list.filter(id => id !== target.id);
    owners.set(message.guild.id, newList);

    return message.reply(`✅ ${target} owner listesinden çıkarıldı.`);
  }

  if (command === "owner-list") {
    const list = owners.get(message.guild.id) || [];
    if (!list.length) {
      return message.reply("Owner listesi boş.");
    }

    return message.reply(
      `👑 Owner listesi:\n${list.map(id => `<@${id}>`).join("\n")}`
    );
  }

  if (command === "mute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("Bu komut için **Üyeleri Sustur** yetkisi gerekir.");
    }

    const target = message.mentions.members.first();
    const duration = parseDuration(args[1] || "30m");
    const reason = args.slice(2).join(" ") || "Sebep belirtilmedi";

    if (!target || !duration) {
      return message.reply("Kullanım: `!mute @kullanıcı 30m sebep`");
    }

    const ok = await muteMember(target, duration, reason, message.member);
    if (ok) {
      return message.reply(`🔇 ${target} **${durationText(duration)}** susturuldu.`);
    }

    return message.reply("Bu üyeyi susturamıyorum.");
  }

  if (command === "unmute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("Bu komut için yetkin yok.");
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply("Kullanım: `!unmute @kullanıcı`");

    try {
      await target.timeout(null, "Manuel olarak susturma kaldırıldı");
      return message.reply(`🔊 ${target} susturması kaldırıldı.`);
    } catch {
      return message.reply("Bu kullanıcı susturulmuş değil.");
    }
  }

  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("Bu komut için **Üyeleri Yasakla** yetkisi gerekir.");
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";

    if (!target) return message.reply("Kullanım: `!ban @kullanıcı sebep`");

    try {
      await target.ban({ reason });
      return message.reply(`🔨 ${target.user.tag} sunucudan yasaklandı.`);
    } catch {
      return message.reply("Bu üyeyi yasaklayamadım.");
    }
  }

  if (command === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply("Bu komut için **Üyeleri At** yetkisi gerekir.");
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";

    if (!target) return message.reply("Kullanım: `!kick @kullanıcı sebep`");

    try {
      await target.kick(reason);
      return message.reply(`👢 ${target.user.tag} sunucudan atıldı.`);
    } catch {
      return message.reply("Bu üyeyi atamadım.");
    }
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const guild = interaction.guild;
  const member = interaction.member;
  const settings = getConfig(guild.id);

  if (interaction.commandName === "ip") {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🌍 CubixoraSMP IP Bilgisi")
      .setDescription("Sunucumuza katılmak için aşağıdaki bilgileri kullanabilirsin.")
      .addFields(
        {
          name: "☕ Java Edition",
          value:
            `IP: \`${MC_IP}\`\n` +
            `Port: \`${MC_JAVA_PORT}\`\n` +
            `Versiyon: \`1.16.5 - 1.26.2\``
        },
        {
          name: "📱 Bedrock Edition",
          value:
            `IP: \`${MC_IP}\`\n` +
            `Port: \`${MC_BEDROCK_PORT}\`\n` +
            `Versiyon: \`1.26+\``
        }
      )
      .setFooter({ text: `${BOT_NAME} • Minecraft Sunucu` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "kelime-kanal") {
    if (!hasAdmin(member)) {
      return interaction.reply({
        content: "Bu komutu kullanmak için yetkin yok.",
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel("kanal");
    settings.wordChannel = channel.id;

    return interaction.reply(`✅ Kelime oyunu kanalı ${channel} olarak ayarlandı.`);
  }

  if (interaction.commandName === "hosgeldin-kanal") {
    if (!hasAdmin(member)) {
      return interaction.reply({
        content: "Bu komutu kullanmak için yetkin yok.",
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel("kanal");
    settings.welcomeChannel = channel.id;

    return interaction.reply(`✅ Hoşgeldin kanalı ${channel} olarak ayarlandı.`);
  }

  if (interaction.commandName === "gulegule-kanal") {
    if (!hasAdmin(member)) {
      return interaction.reply({
        content: "Bu komutu kullanmak için yetkin yok.",
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel("kanal");
    settings.goodbyeChannel = channel.id;

    return interaction.reply(`✅ Güle güle kanalı ${channel} olarak ayarlandı.`);
  }
});

process.on("unhandledRejection", err => {
  console.log("Unhandled rejection:", err.message);
});

process.on("uncaughtException", err => {
  console.log("Uncaught exception:", err.message);
});

client.login("MTU1MDUxMTM0NDIzMzQ4NDQwMA.GHWbAN.ZfpVQwvj0n5T4DPrZ4lHa9jpetC-RaHPDlP2Uo");
