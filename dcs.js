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

const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus 
} = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

const PREFIX = "e!";
const BOT_NAME = "Cubixorasmp";

const MC_IP = "cubixorasmp.play.hosting";
const MC_BEDROCK_PORT = "19132";
const JAVA_VERSION = "1.16.5 - 26.2";
const BEDROCK_VERSION = "1.26+";

const guildSettings = new Map();
const guildOwners = new Map();

function getSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, {
      welcomeChannel: null,
      goodbyeChannel: null,
      dcCezaChannel: null,
      mcCezaChannel: null,
      mcSohbetChannel: null,
      protectedRoles: []
    });
  }
  return guildSettings.get(guildId);
}

function getOwners(guildId) {
  if (!guildOwners.has(guildId)) {
    guildOwners.set(guildId, []);
  }
  return guildOwners.get(guildId);
}

function parseDuration(text) {
  if (!text) return null;
  const match = text.toLowerCase().match(/^(\d+)(s|sn|m|dk|h|sa|d|g)$/);
  if (!match) return null;
  const number = Number(match[1]);
  const unit = match[2];
  const map = {
    s: 1000, sn: 1000,
    m: 60 * 1000, dk: 60 * 1000,
    h: 60 * 60 * 1000, sa: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000, g: 24 * 60 * 60 * 1000
  };
  return number * (map[unit] || 1000);
}

const slashCommands = [
  new SlashCommandBuilder().setName("ip").setDescription("Sunucu IP ve Sürüm bilgilerini gösterir"),
  new SlashCommandBuilder().setName("hoşgeldin-kanal").setDescription("Hoşgeldin kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("gülegüle-kanal").setDescription("Güle güle kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("dc-ceza").setDescription("Discord ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("mc-ceza").setDescription("Minecraft ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("mcsohbet").setDescription("Minecraft sohbet/giriş-çıkış log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  
  new SlashCommandBuilder().setName("owner-ekle").setDescription("Sunucuya yeni bir owner ekler").addUserOption(o => o.setName("uye").setDescription("Owner yapılacak üye").setRequired(true)),
  new SlashCommandBuilder().setName("owner-çıkar").setDescription("Sunucudaki bir owner'ı çıkarır").addUserOption(o => o.setName("uye").setDescription("Ownerlıktan çıkarılacak üye").setRequired(true)),
  new SlashCommandBuilder().setName("owner-list").setDescription("Sunucudaki owner'ları listeler"),

  new SlashCommandBuilder().setName("korma-ekle").setDescription("Korunacak rolü sisteme ekler").addRoleOption(o => o.setName("rol").setDescription("Korunacak Rol").setRequired(true)),
  new SlashCommandBuilder().setName("korma-cikar").setDescription("Korunacak rolü sistemden çıkarır").addRoleOption(o => o.setName("rol").setDescription("Kaldırılacak Rol").setRequired(true)),
  new SlashCommandBuilder().setName("korma-list").setDescription("Korumalı rolleri listeler"),

  new SlashCommandBuilder().setName("ban").setDescription("Kullanıcıyı sunucudan yasaklar").addUserOption(o => o.setName("uye").setDescription("Yasaklanacak üye").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Sebep").setRequired(false)),
  new SlashCommandBuilder().setName("mute").setDescription("Kullanıcıyı susturur").addUserOption(o => o.setName("uye").setDescription("Susturulacak üye").setRequired(true)).addStringOption(o => o.setName("süre").setDescription("Süre (örn: 30m, 1h)").setRequired(true)).addStringOption(o => o.setName("sebep").setDescription("Sebep").setRequired(false)),

  new SlashCommandBuilder().setName("ticket-kur")
    .setDescription("Ticket sistemi kurar")
    .addChannelOption(o => o.setName("kanal").setDescription("Kurulacak Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addRoleOption(o => o.setName("yetkili-rol").setDescription("Ticketlara bakacak yetkili rolü").setRequired(true))
    .addStringOption(o => o.setName("baslik").setDescription("Ticket Panel Başlığı").setRequired(true))
    .addStringOption(o => o.setName("aciklama").setDescription("Ticket Panel Açıklaması").setRequired(true)),

  new SlashCommandBuilder().setName("müzikpanelyarat").setDescription("Butonlu müzik kontrol paneli kurar").addChannelOption(o => o.setName("kanal").setDescription("Panelin kurulacağı kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("çal").setDescription("Müzik çalar").addStringOption(o => o.setName("şarkı").setDescription("Şarkı adı veya YouTube linki").setRequired(true)),
  new SlashCommandBuilder().setName("durdur").setDescription("Çalan müziği durdurur/oynatır"),
  new SlashCommandBuilder().setName("ayrıl").setDescription("Botu ses kanalından çıkarır")
];

client.once("ready", async () => {
  console.log(`${BOT_NAME} aktif!`);
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
    if (channel) channel.send(`🎮 [Sunucu] **${member.user.tag}** sunucuya katıldı! (Bedrock/Java Giriş)`);
  }
  if (!settings.welcomeChannel) return;
  const channel = member.guild.channels.cache.get(settings.welcomeChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("👋 Hoş Geldin!")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`**${member.user.tag}** sunucumuza hoş geldin!\n\nToplam üye: **${member.guild.memberCount}**`)
    .setFooter({ text: `${BOT_NAME} • Hoşgeldin` })
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
    .setFooter({ text: `${BOT_NAME} • Güle Güle` })
    .setTimestamp();
  channel.send({ embeds: [embed] });
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  const settings = getSettings(message.guild.id);
  const content = message.content;
  const lower = content.toLowerCase().trim();

  if (["sa", "s.a", "selam", "selamün aleyküm", "selamun aleykum", "selamin aleykum"].includes(lower)) {
    return message.reply("Aleyküm Selam, hoş geldin! 👋");
  }

  if (settings.protectedRoles && settings.protectedRoles.length > 0) {
    const mentionedRoles = message.mentions.roles;
    const isProtectedTagged = mentionedRoles.some(role => settings.protectedRoles.includes(role.id));

    if (isProtectedTagged && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      try {
        await message.delete();
        await message.member.timeout(30 * 60 * 1000, "Korumalı Rolü Etiketleme");
        message.channel.send(`⚠️ ${message.author}, korumalı bir rolü etiketlediğin için mesajın silindi ve **30 dakika** susturuldun!`).then(m => setTimeout(() => m.delete().catch(()=>{}), 5000));
        
        if (settings.dcCezaChannel) {
          const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);
          if (logChan) {
            const embed = new EmbedBuilder().setColor(0xed4245).setTitle("🚨 KORUMALI ROL ETİKETLEME CEZASI")
              .addFields({ name: "👤 Üye", value: `${message.author}` }, { name: "Ceza", value: "Mesaj Silindi + 30dk Mute" }).setTimestamp();
            logChan.send({ embeds: [embed] });
          }
        }
      } catch {}
      return;
    }
  }

  const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discord\.com\/invite)\/.+$/i;
  const linkRegex = /https?:\/\/[^\s]+/i;
  if (inviteRegex.test(content) || linkRegex.test(content)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      try {
        await message.delete();
        await message.member.timeout(24 * 60 * 60 * 1000, "Reklam / İzinsiz Link");
        message.channel.send(`⚠️ ${message.author}, reklam/link paylaştığın için mesajın silindi ve **1 gün** susturuldun!`).then(m => setTimeout(() => m.delete().catch(()=>{}), 5000));
        
        if (settings.dcCezaChannel) {
          const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);
          if (logChan) {
            const embed = new EmbedBuilder().setColor(0xed4245).setTitle("🚨 OTOMATİK CEZA — REKLAM")
              .addFields({ name: "👤 Üye", value: `${message.author}` }, { name: "Sebep", value: "İzinsiz Link" }).setTimestamp();
            logChan.send({ embeds: [embed] });
          }
        }
      } catch {}
      return;
    }
  }

  if (lower === "e!owner") {
    const owners = getOwners(message.guild.id);
    if (owners.length === 0) {
      return message.reply("⚠️ Bu sunucuda henüz kayıtlı bir owner bulunmuyor. (Yönetici `/owner-ekle` komutuyla ekleyebilir)");
    }
    const ownerTags = owners.map(id => `<@${id}>`).join("\n");
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`👑 ${message.guild.name} — Sunucu Ownerları`)
      .setDescription(ownerTags)
      .setFooter({ text: `${BOT_NAME} • Owner Listesi` })
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  let usedPrefix = content.startsWith(PREFIX) ? PREFIX : (content.startsWith("!") ? "!" : null);
  if (!usedPrefix) return;

  const args = content.slice(usedPrefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "sil") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("Yetkin yok.");
    const count = parseInt(args[0]);
    if (!count || count < 1 || count > 1000) return message.reply("1 ile 1000 arası sayı gir.");
    try {
      await message.channel.bulkDelete(count, true);
      const m = await message.channel.send(`✅ **${count}** mesaj silindi.`);
      setTimeout(() => m.delete().catch(() => {}), 4000);
    } catch {
      message.reply("Mesajlar silinemedi.");
    }
  }

  if (command === "ip") {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🌍 CubixoraSMP IP ve Sürüm Bilgisi")
      .addFields(
        { name: "☕ Java Sürüm & IP", value: `IP: \`${MC_IP}\`\nSürüm: \`${JAVA_VERSION}\`` },
        { name: "📱 Bedrock Sürüm, IP & Port", value: `IP: \`${MC_IP}\`\nPort: \`${MC_BEDROCK_PORT}\`\nSürüm: \`${BEDROCK_VERSION}\`` }
      );
    return message.reply({ embeds: [embed] });
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
        .setTitle("🌍 CubixoraSMP IP ve Sürüm Bilgisi")
        .addFields(
          { name: "☕ Java Sürüm & IP", value: `IP: \`${MC_IP}\`\nSürüm: \`${JAVA_VERSION}\`` },
          { name: "📱 Bedrock Sürüm, IP & Port", value: `IP: \`${MC_IP}\`\nPort: \`${MC_BEDROCK_PORT}\`\nSürüm: \`${BEDROCK_VERSION}\`` }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === "owner-ekle") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const targetUser = interaction.options.getUser("uye");
      const owners = getOwners(guild.id);
      if (owners.includes(targetUser.id)) return interaction.reply({ content: `⚠️ ${targetUser} zaten owner listesinde!`, ephemeral: true });
      owners.push(targetUser.id);
      return interaction.reply({ content: `✅ ${targetUser} owner listesine eklendi!` });
    }

    if (interaction.commandName === "owner-çıkar") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const targetUser = interaction.options.getUser("uye");
      let owners = getOwners(guild.id);
      if (!owners.includes(targetUser.id)) return interaction.reply({ content: `⚠️ ${targetUser} listede yok.`, ephemeral: true });
      guildOwners.set(guild.id, owners.filter(id => id !== targetUser.id));
      return interaction.reply({ content: `✅ ${targetUser} owner listesinden çıkarıldı.` });
    }

    if (interaction.commandName === "owner-list") {
      const owners = getOwners(guild.id);
      if (owners.length === 0) return interaction.reply({ content: "⚠️ Kayıtlı owner yok.", ephemeral: true });
      const ownerTags = owners.map(id => `<@${id}>`).join("\n");
      const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle(`👑 ${guild.name} — Owner Listesi`).setDescription(ownerTags).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "korma-ekle") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const role = interaction.options.getRole("rol");
      if (settings.protectedRoles.includes(role.id)) return interaction.reply({ content: `⚠️ Bu rol zaten korumalı listede!`, ephemeral: true });
      settings.protectedRoles.push(role.id);
      return interaction.reply({ content: `✅ ${role} başarıyla korumalı rollere eklendi.` });
    }

    if (interaction.commandName === "korma-cikar") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const role = interaction.options.getRole("rol");
      if (!settings.protectedRoles.includes(role.id)) return interaction.reply({ content: `⚠️ Bu rol korumalı listede bulunmuyor.`, ephemeral: true });
      settings.protectedRoles = settings.protectedRoles.filter(id => id !== role.id);
      return interaction.reply({ content: `✅ ${role} korumalı rollerden çıkarıldı.` });
    }

    if (interaction.commandName === "korma-list") {
      if (settings.protectedRoles.length === 0) return interaction.reply({ content: "⚠️ Korumalı rol bulunmuyor.", ephemeral: true });
      const roleTags = settings.protectedRoles.map(id => `<@&${id}>`).join("\n");
      const embed = new EmbedBuilder().setColor(0xe74c3c).setTitle("🛡️ Korumalı Roller Listesi").setDescription(roleTags).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "ban") {
      if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) return interaction.reply({ content: "❌ Üyeleri Yasakla yetkin yok.", ephemeral: true });
      const targetUser = interaction.options.getUser("uye");
      const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember && !targetMember.bannable) return interaction.reply({ content: "❌ Bu kullanıcıyı banlayamam (Yetkisi benden üstün).", ephemeral: true });

      try {
        await guild.members.ban(targetUser.id, { reason: sebep });
        interaction.reply({ content: `✅ **${targetUser.tag}** sunucudan banlandı. Sebep: ${sebep}` });

        if (settings.dcCezaChannel) {
          const logChan = guild.channels.cache.get(settings.dcCezaChannel);
          if (logChan) {
            const embed = new EmbedBuilder().setColor(0xed4245).setTitle("🔨 YETKİLİ BAN")
              .addFields({ name: "👤 Banlanan", value: `${targetUser}` }, { name: "🛡️ Yetkili", value: `${member}` }, { name: "Sebep", value: sebep }).setTimestamp();
            logChan.send({ embeds: [embed] });
          }
        }
      } catch (e) {
        interaction.reply({ content: "❌ Ban işlemi başarısız oldu.", ephemeral: true });
      }
    }

    if (interaction.commandName === "mute") {
      if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({ content: "❌ Üyeleri Sustur yetkin yok.", ephemeral: true });
      const targetUser = interaction.options.getUser("uye");
      const süreStr = interaction.options.getString("süre");
      const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ Kullanıcı bulunamadı.", ephemeral: true });
      const msDuration = parseDuration(süreStr);
      if (!msDuration) return interaction.reply({ content: "❌ Geçersiz süre formatı! (Örn: `30m`, `1h`, `1d`)", ephemeral: true });

      try {
        await targetMember.timeout(msDuration, sebep);
        interaction.reply({ content: `✅ **${targetUser.tag}** başarıyla **${süreStr}** süreyle susturuldu.` });

        if (settings.dcCezaChannel) {
          const logChan = guild.channels.cache.get(settings.dcCezaChannel);
          if (logChan) {
            const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle("🔇 YETKİLİ MUTE (SUSTURMA)")
              .addFields({ name: "👤 Susturulan", value: `${targetUser}` }, { name: "Süre", value: süreStr }, { name: "Yetkili", value: `${member}` }, { name: "Sebep", value: sebep }).setTimestamp();
            logChan.send({ embeds: [embed] });
          }
        }
      } catch (e) {
        interaction.reply({ content: "❌ Susturma işlemi başarısız oldu.", ephemeral: true });
      }
    }

    if (interaction.commandName === "müzikpanelyarat") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const channel = interaction.options.getChannel("kanal");

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("🎶 CubixoraSMP Müzik Paneli")
        .setDescription("Aşağıdaki butonları kullanarak ses kanalında müziği durdurabilir, devam ettirebilir veya bottan ayrılmasını sağlayabilirsin!\n\n*(Şarkı çalmak için `/çal [şarkı adı]` komutunu kullanabilirsin)*")
        .setFooter({ text: `${BOT_NAME} • Müzik Sistemi` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("music_pause").setLabel("Durdur / Devam Et").setStyle(ButtonStyle.Primary).setEmoji("⏯️"),
        new ButtonBuilder().setCustomId("music_stop").setLabel("Ayrıl").setStyle(ButtonStyle.Danger).setEmoji("⏹️")
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Müzik paneli ${channel} kanalına başarıyla kuruldu!`, ephemeral: true });
    }

    if (interaction.commandName === "ticket-kur") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yönetici olmalısın.", ephemeral: true });
      const channel = interaction.options.getChannel("kanal");
      const yetkiliRol = interaction.options.getRole("yetkili-rol");
      const baslik = interaction.options.getString("baslik");
      const aciklama = interaction.options.getString("aciklama");

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎫 ${baslik}`)
        .setDescription(aciklama)
        .setFooter({ text: `${BOT_NAME} • Yetkili Rol: ${yetkiliRol.name}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`create_ticket_${yetkiliRol.id}`).setLabel("Destek Talebi Aç").setStyle(ButtonStyle.Primary).setEmoji("🎫")
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Ticket paneli ${channel} kanalına kuruldu! Yetkili Rol: **${yetkiliRol.name}**`, ephemeral: true });
    }

    if (interaction.commandName === "hoşgeldin-kanal") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.welcomeChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: "✅ Hoşgeldin kanalı ayarlandı.", ephemeral: true });
    }

    if (interaction.commandName === "gülegüle-kanal") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.goodbyeChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: "✅ Güle güle kanalı ayarlandı.", ephemeral: true });
    }

    if (interaction.commandName === "dc-ceza") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.dcCezaChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: "✅ Discord ceza log kanalı ayarlandı.", ephemeral: true });
    }

    if (interaction.commandName === "mc-ceza") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.mcCezaChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: "✅ Minecraft ceza log kanalı ayarlandı.", ephemeral: true });
    }

    if (interaction.commandName === "mcsohbet") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      settings.mcSohbetChannel = interaction.options.getChannel("kanal").id;
      return interaction.reply({ content: "✅ Minecraft sohbet kanalı ayarlandı.", ephemeral: true });
    }

    if (interaction.commandName === "çal") {
      const channel = member.voice.channel;
      if (!channel) return interaction.reply({ content: "❌ Önce bir ses kanalına girmelisin!", ephemeral: true });

      const query = interaction.options.getString("şarkı");
      await interaction.deferReply();

      try {
        const stream = ytdl(query, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream);
        const player = createAudioPlayer();

        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        connection.subscribe(player);
        player.play(resource);

        client.activeAudioPlayer = player;

        return interaction.editReply(`🎶 Çalınıyor: **${query}**`);
      } catch (e) {
        return interaction.editReply("❌ Şarkı oynatılırken bir hata oluştu veya link geçersiz.");
      }
    }

    if (interaction.commandName === "durdur") {
      if (client.activeAudioPlayer) {
        if (client.activeAudioPlayer.state.status === AudioPlayerStatus.Playing) {
          client.activeAudioPlayer.pause();
          return interaction.reply({ content: "⏸️ Müzik durduruldu.", ephemeral: true });
        } else {
          client.activeAudioPlayer.unpause();
          return interaction.reply({ content: "▶️ Müzik devam ettiriliyor.", ephemeral: true });
        }
      }
      return interaction.reply({ content: "❌ Aktif çalan bir müzik yok.", ephemeral: true });
    }

    if (interaction.commandName === "ayrıl") {
      const connection = require("@discordjs/voice").getVoiceConnection(guild.id);
      if (connection) {
        connection.destroy();
        return interaction.reply({ content: "👋 Ses kanalından ayrıldım." });
      }
      return interaction.reply({ content: "❌ Zaten bir ses kanalında değilim.", ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === "music_pause") {
      if (client.activeAudioPlayer) {
        if (client.activeAudioPlayer.state.status === AudioPlayerStatus.Playing) {
          client.activeAudioPlayer.pause();
          return interaction.reply({ content: "⏸️ Müzik durduruldu.", ephemeral: true });
        } else {
          client.activeAudioPlayer.unpause();
          return interaction.reply({ content: "▶️ Müzik devam ettiriliyor.", ephemeral: true });
        }
      }
      return interaction.reply({ content: "❌ Aktif çalan bir müzik yok.", ephemeral: true });
    }

    if (interaction.customId === "music_stop") {
      const connection = require("@discordjs/voice").getVoiceConnection(interaction.guild.id);
      if (connection) {
        connection.destroy();
        return interaction.reply({ content: "⏹️ Müzik durduruldu ve ses kanalından ayrıldı.", ephemeral: true });
      }
      return interaction.reply({ content: "❌ Bot zaten ses kanalında değil.", ephemeral: true });
    }

    if (interaction.customId.startsWith("create_ticket_")) {
      const userOpenTickets = interaction.guild.channels.cache.filter(
        ch => ch.name.startsWith("ticket-") && ch.permissionOverwrites.cache.has(interaction.user.id)
      );

      if (userOpenTickets.size >= 5) {
        return interaction.reply({ content: "⚠️ Aynı anda en fazla **5 adet** açık destek talebine sahip olabilirsin!", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      const roleId = interaction.customId.split("_")[2];

      const ticketChan = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim_ticket").setLabel("Talebi Üstlen").setStyle(ButtonStyle.Success).setEmoji("🙋‍♂️"),
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Talebi Kapat").setStyle(ButtonStyle.Danger).setEmoji("🔒")
      );
      
      await ticketChan.send({ 
        content: `👋 Merhaba ${interaction.user}! <@&${roleId}> ekibimiz (en güvendiğiniz, cana yakın ve çalışkan kadromuz) seninle ilgilenmek için birazdan burada olacak.\n🚀 **Çok yakında harika yenilikler ve sürprizlerle geliyoruz, takipte kalın!**`, 
        components: [row] 
      });
      
      return interaction.editReply({ content: `✅ Destek odan açıldı: ${ticketChan}` });
    }

    if (interaction.customId === "claim_ticket") {
      await interaction.reply({ content: `🙋‍♂️ Bu destek talebi **${interaction.user.tag}** tarafından üstlenildi!` });
    }

    if (interaction.customId === "close_ticket") {
      await interaction.reply({ content: "🔒 Talep kapatılıyor..." });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
  }
});

client.login(process.env.TOKEN);
