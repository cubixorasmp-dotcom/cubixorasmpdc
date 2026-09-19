require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  ActivityType,
  SlashCommandBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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

const PREFIX = "e!";
const BOT_NAME = "Cubixorasmp";

const MC_IP = "cubixorasmp.play.hosting";
const MC_JAVA_PORT = "25565";
const MC_BEDROCK_PORT = "19132";

const guildSettings = new Map();

function getSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, {
      welcomeChannel: null,
      goodbyeChannel: null,
      dcCezaChannel: null,
      mcCezaChannel: null,
      mcSohbetChannel: null,
      wordChannel: null,
      protectedRoles: []
    });
  }
  return guildSettings.get(guildId);
}

function parseDuration(text) {
  if (!text) return null;
  const match = text.toLowerCase().match(/^(\d+)(s|sn|m|dk|h|sa|d|g|ay)$/);
  if (!match) return null;

  const number = Number(match[1]);
  const unit = match[2];
  const map = {
    s: 1000, sn: 1000,
    m: 60 * 1000, dk: 60 * 1000,
    h: 60 * 60 * 1000, sa: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000, g: 24 * 60 * 60 * 1000,
    ay: 30 * 24 * 60 * 60 * 1000
  };
  return number * (map[unit] || 1000);
}

function durationText(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} saniye`;   if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)} dakika`;
  if (totalSeconds < 86400) return `${Math.floor(totalSeconds / 3600)} saat`;   if (totalSeconds < 2592000) return `${Math.floor(totalSeconds / 86400)} gün`;
  return `${Math.floor(totalSeconds / 2592000)} ay`; }  const slashCommands = [   new SlashCommandBuilder().setName("ip").setDescription("Sunucu IP bilgilerini gösterir"),   new SlashCommandBuilder().setName("hoşgeldin-kanal").setDescription("Hoşgeldin kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),   new SlashCommandBuilder().setName("gülegüle-kanal").setDescription("Güle güle kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),   new SlashCommandBuilder().setName("dc-ceza").setDescription("Discord ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),   new SlashCommandBuilder().setName("mc-ceza").setDescription("Minecraft ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),   new SlashCommandBuilder().setName("mcsohbet").setDescription("Minecraft sohbet/giriş-çıkış log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),   new SlashCommandBuilder().setName("koruma").setDescription("Koruma altına alınacak rol veya üyeyi ekler/çıkarır").addStringOption(o => o.setName("islem").setDescription("Ekle veya Çıkar").setRequired(true).addChoices({ name: "Ekle", value: "ekle" }, { name: "Çıkar", value: "cikar" })).addRoleOption(o => o.setName("rol").setDescription("Korunacak Rol").setRequired(false)).addUserOption(o => o.setName("uye").setDescription("Korunacak Üye").setRequired(false)),   new SlashCommandBuilder().setName("çekiliş").setDescription("Çekiliş başlatır").addStringOption(o => o.setName("ödül").setDescription("Ödül nedir?").setRequired(true)).addStringOption(o => o.setName("süre").setDescription("Örn: 1h, 1d").setRequired(true)),   new SlashCommandBuilder().setName("anket").setDescription("Anket oluşturur").addStringOption(o => o.setName("soru").setDescription("Anket sorusu").setRequired(true)),   new SlashCommandBuilder().setName("ticket-kur").setDescription("Özel isim ve açıklama ile ticket sistemi kurar")     .addChannelOption(o => o.setName("kanal").setDescription("Kurulacak Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true))     .addStringOption(o => o.setName("isim").setDescription("Ticket Panel Başlığı").setRequired(true))     .addStringOption(o => o.setName("aciklama").setDescription("Ticket Panel Açıklaması").setRequired(true)) ];  client.once("ready", async () => {   console.log(`${BOT_NAME} aktif!`);
  client.user.setPresence({
    activities: [{ name: "CubixoraSMP | !ip", type: ActivityType.Watching }],
    status: "online"
  });

  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(slashCommands.map(c => c.toJSON()));
    } catch {}
  }
});

client.on("guildMemberAdd", async member => {
  const settings = getSettings(member.guild.id);
  if (settings.mcSohbetChannel) {
    const channel = member.guild.channels.cache.get(settings.mcSohbetChannel);
    if (channel) channel.send(`🎮 [Sunucu] **${member.user.tag}** sunucuya katıldı!`);
  }
  if (!settings.welcomeChannel) return;
  const channel = member.guild.channels.cache.get(settings.welcomeChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("👋 Hoş Geldin!")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`**${member.user.tag}** sunucumuza hoş geldin!\n\nToplam üye: **${member.guild.memberCount}**`)
    .setTimestamp();
  channel.send({ embeds: [embed] });
});

client.on("guildMemberRemove", async member => {
  const settings = getSettings(member.guild.id);
  if (settings.mcSohbetChannel) {
    const channel = member.guild.channels.cache.get(settings.mcSohbetChannel);
    if (channel) channel.send(`🎮 [Sunucu] **${member.user.tag}** sunucudan ayrıldı.`);
  }
  if (!settings.goodbyeChannel) return;
  const channel = member.guild.channels.cache.get(settings.goodbyeChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("👋 Güle Güle!")
    .setDescription(`**${member.user.tag}** sunucudan ayrıldı.\n\nKalan üye: **${member.guild.memberCount}**`)
    .setTimestamp();
  channel.send({ embeds: [embed] });
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  const settings = getSettings(message.guild.id);
  const content = message.content;
  const lower = content.toLowerCase().trim();

  // Selamlama Yanıtı
  if (["sa", "s.a", "selam", "selamün aleyküm", "selamun aleykum", "selamin aleykum"].includes(lower)) {
    return message.reply("Aleyküm Selam, hoş geldin! 👋");
  }

  // Reklam Koruması
  const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discord\.com\/invite)\/.+$/i;
  const linkRegex = /https?:\/\/[^\s]+/i;
  if (inviteRegex.test(content) || linkRegex.test(content)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      try {
        await message.delete();
        const oneDay = 24 * 60 * 60 * 1000;
        await message.member.timeout(oneDay, "Reklam / İzinsiz Link Paylaşımı");
        message.channel.send(`⚠️ ${message.author}, reklam/link paylaştığın için **1 gün** susturuldun!`).then(m => setTimeout(() => m.delete().catch(()=>{}), 5000));                  if (settings.dcCezaChannel) {           const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);           if (logChan) {             const embed = new EmbedBuilder()               .setColor(0xed4245)               .setTitle("🚨 OTOMATİK CEZA — REKLAM MUTE")               .addFields({ name: "Üye", value: `${message.author}` }, { name: "Süre", value: "1 Gün" })
              .setTimestamp();
            logChan.send({ embeds: [embed] });
          }
        }
      } catch {}
      return;
    }
  }

  let usedPrefix = null;
  if (content.startsWith(PREFIX)) usedPrefix = PREFIX;
  else if (content.startsWith("!")) usedPrefix = "!";
  else return;

  const args = content.slice(usedPrefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "sil") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("Bu komut için **Mesajları Yönet** yetkin olmalı.");
    }
    const count = parseInt(args[0]);
    if (!count || count < 1 || count > 1000) {
      return message.reply("Lütfen 1 ile 1000 arasında bir sayı belirtin! Örn: `!sil 50`");
    }
    try {
      await message.channel.bulkDelete(count, true);
      const m = await message.channel.send(`✅ Başarıyla **${count}** mesaj silindi.`);
      setTimeout(() => m.delete().catch(() => {}), 4000);
    } catch {
      message.reply("Mesajlar silinirken hata oluştu.");
    }
  }

  if (command === "mute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("Bu komut için **Üyeleri Sustur** yetkin olmalı.");
    }
    const target = message.mentions.members.first();
    const durationArg = args[1] || "30m";
    const duration = parseDuration(durationArg) || (30 * 60 * 1000);
    const reason = args.slice(2).join(" ") || "Sebep belirtilmedi";

    if (!target) return message.reply("Kullanım: `!mute @kullanıcı 30m [sebep]`");

    try {
      await target.timeout(duration, reason);
      message.reply(`🔇 ${target} **${durationText(duration)}** susturuldu.`);

      if (settings.dcCezaChannel) {
        const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);
        if (logChan) {
          const embed = new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("🔇 Discord Ceza — MUTE")
            .addFields({ name: "Üye", value: `${target}` }, { name: "Süre", value: durationArg }, { name: "Sebep", value: reason })
            .setTimestamp();
          logChan.send({ embeds: [embed] });
        }
      }
    } catch {
      message.reply("Üye susturulamadı.");
    }
  }

  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("Bu komut için **Üyeleri Yasakla** yetkin olmalı.");
    }
    const target = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";

    if (!target) return message.reply("Kullanım: `!ban @kullanıcı [sebep]`");

    try {
      await target.ban({ reason });
      message.reply(`🔨 ${target.user.tag} yasaklandı.`);        if (settings.dcCezaChannel) {         const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);         if (logChan) {           const embed = new EmbedBuilder()             .setColor(0x990000)             .setTitle("🔨 Discord Ceza — BAN")             .addFields({ name: "Üye", value: `${target.user.tag}` }, { name: "Sebep", value: reason })
            .setTimestamp();
          logChan.send({ embeds: [embed] });
        }
      }
    } catch {
      message.reply("Üye yasaklanamadı.");
    }
  }
});

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const guild = interaction.guild;
    const member = interaction.member;
    const settings = getSettings(guild.id);

    if (interaction.commandName === "ip") {
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🌍 CubixoraSMP IP Bilgisi")
        .addFields(
          { name: "☕ Java Edition", value: `IP: \`${MC_IP}\`\nPort: \`${MC_JAVA_PORT}\`` },
          { name: "📱 Bedrock Edition", value: `IP: \`${MC_IP}\`\nPort: \`${MC_BEDROCK_PORT}\`` }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === "ticket-kur") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      const channel = interaction.options.getChannel("kanal");
      const isim = interaction.options.getString("isim");
      const aciklama = interaction.options.getString("aciklama");

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎫 ${isim}`)
        .setDescription(aciklama);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("create_ticket").setLabel("Destek Talebi Aç").setStyle(ButtonStyle.Primary).setEmoji("🎫")
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Ticket paneli başarıyla ${channel} kanalına kuruldu!`, ephemeral: true });
    }

    if (interaction.commandName === "hoşgeldin-kanal") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.welcomeChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: `✅ Hoşgeldin kanalı ayarlandı.`, ephemeral: true });
    }

    if (interaction.commandName === "gülegüle-kanal") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.goodbyeChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: `✅ Güle güle kanalı ayarlandı.`, ephemeral: true });
    }

    if (interaction.commandName === "dc-ceza") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.dcCezaChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: `✅ Discord ceza log kanalı ayarlandı.`, ephemeral: true });
    }

    if (interaction.commandName === "mc-ceza") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.mcCezaChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: `✅ Minecraft ceza log kanalı ayarlandı.`, ephemeral: true });
    }

    if (interaction.commandName === "mcsohbet") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.mcSohbetChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: `✅ Minecraft sohbet kanalı ayarlandı.`, ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === "create_ticket") {
      await interaction.deferReply({ ephemeral: true });
      const ticketChan = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
      });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Talebi Kapat").setStyle(ButtonStyle.Danger).setEmoji("🔒")
      );
      await ticketChan.send({ content: `${interaction.user}`, components: [row] });
      return interaction.editReply({ content: `✅ Destek odan açıldı: ${ticketChan}` });
    }

    if (interaction.customId === "close_ticket") {
      await interaction.reply({ content: "🔒 Talep kapatılıyor..." });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
  }
});

client.login(process.env.TOKEN);
