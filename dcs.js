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
const util = require("minecraft-server-util");

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
const MC_BEDROCK_PORT = 19132;
const JAVA_VERSION = "1.16.5 - 26.2";
const BEDROCK_VERSION = "1.26+";

// Rastgele çalınacak varsayılan şarkı havuzu (İstediğin YouTube linklerini veya şarkı adlarını ekleyebilirsin)
const randomPlaylist = [
  "https://www.youtube.com/watch?v=5qap5aO4i9A", // Örnek lofi
  "https://www.youtube.com/watch?v=jfKfPfyJRdk", // Örnek lofi 2
  "Lo-fi hip hop radio"
];

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
      aiChannel: null,
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
  new SlashCommandBuilder().setName("restart").setDescription("Botu yeniden başlatır (Yalnızca Yöneticiler)"),
  new SlashCommandBuilder().setName("hoşgeldin-kanal").setDescription("Hoşgeldin kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("gülegüle-kanal").setDescription("Güle güle kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("dc-ceza").setDescription("Discord ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("mc-ceza").setDescription("Minecraft ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("mcsohbet").setDescription("Minecraft sohbet/giriş-çıkış log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("yapayzrakakal").setDescription("Yapay zeka sohbet kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  
  new SlashCommandBuilder().setName("owner-ekle").setDescription("Sunucuya yeni bir owner ekler").addUserOption(o => o.setName("uye").setDescription("Owner yapılacak üye").setRequired(true)),
  new SlashCommandBuilder().setName("owner-çıkar").setDescription("Sunucudaki bir owner'ı çıkarır").addUserOption(o => o.setName("uye").setDescription("Ownerlıktan çıkarılacak üye").setRequired(true)),
  new SlashCommandBuilder().setName("owner-list").setDescription("Sunucudaki owner'ları listeler"),

  new SlashCommandBuilder().setName("korma-ekle").setDescription("Korunacak rolü sisteme ekler").addRoleOption(o => o.setName("rol").setDescription("Korunacak Rol").setRequired(true)),
  new SlashCommandBuilder().setName("korma-cikar").setDescription("Korunacak rolü sistemden çıkarır").addRoleOption(o => o.setName("rol").setDescription("Kaldırılacak Rol").setRequired(true)),
  new SlashCommandBuilder().setName("korma-list").setDescription("Korumalı rolleri listeler"),

  new SlashCommandBuilder().setName("ticket-kur")
    .setDescription("Ticket sistemi kurar")
    .addChannelOption(o => o.setName("kanal").setDescription("Kurulacak Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addRoleOption(o => o.setName("yetkili-rol").setDescription("Ticketlara bakacak yetkili rolü").setRequired(true))
    .addStringOption(o => o.setName("baslik").setDescription("Ticket Panel Başlığı").setRequired(true))
    .addStringOption(o => o.setName("aciklama").setDescription("Ticket Panel Açıklaması").setRequired(true)),

  new SlashCommandBuilder().setName("müzikpanelyarat").setDescription("Butonlu müzik kontrol paneli kurar").addChannelOption(o => o.setName("kanal").setDescription("Panelin kurulacağı kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName("panelacmezük").setDescription("Ses kanalına katılıp otomatik rastgele müzik çalmaya başlayan özel panel kurar").addChannelOption(o => o.setName("kanal").setDescription("Panelin kurulacağı kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)).addStringOption(o => o.setName("şarkı").setDescription("Özel şarkı (Boş bırakırsan rastgele çalar)").setRequired(false)),
  new SlashCommandBuilder().setName("çal").setDescription("Müzik çalar").addStringOption(o => o.setName("şarkı").setDescription("Şarkı adı veya YouTube linki").setRequired(true)),
  new SlashCommandBuilder().setName("durdur").setDescription("Çalan müziği durdurur/oynatır"),
  new SlashCommandBuilder().setName("ayrıl").setDescription("Botu ses kanalından çıkarır")
];

client.once("ready", async () => {
  console.log(`${BOT_NAME} aktif!`);
  client.user.setPresence({
    activities: [{ name: "CubixoraSMP | !ip ve !aktif", type: ActivityType.Watching }],
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

  if (settings.aiChannel && message.channel.id === settings.aiChannel) {
    const responses = [
      "Anladım, bu konuda sana katılıyorum! 🤖",
      "Gerçekten mi? Harika bir düşünce! ✨",
      "CubixoraSMP sunucumuz için en iyisini yapmaya devam ediyoruz! 🚀",
      `Hmm, ${message.author.username}, bunu biraz daha açar mısın? 🤔`,
      "Bunu duyduğuma sevindim! Başka nasıl yardımcı olabilirim? 💡"
    ];
    const randomResp = responses[Math.floor(Math.random() * responses.length)];
    return message.reply(randomResp);
  }

  if (["sa", "s.a", "selam", "selamün aleyküm", "selamun aleykum", "selamin aleykum"].includes(lower)) {
    return message.reply("Aleyküm Selam, hoş geldin! 👋");
  }

  if (lower === "!aktif") {
    const loadingMsg = await message.reply("🔍 Minecraft sunucu durumu kontrol ediliyor...");
    try {
      const response = await util.status(MC_IP, 25565, { timeout: 3000 });
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🟢 CubixoraSMP — Sunucu Durumu")
        .addFields(
          { name: "Durum", value: "🟢 **Aktif (Çevrimiçi)**", inline: true },
          { name: "Aktif Oyuncu", value: `👥 **${response.players.online} /${response.players.max}**`, inline: true },
          { name: "Sürüm", value: `☕ \`${JAVA_VERSION}\` / 📱 \`${BEDROCK_VERSION}\``, inline: false },
          { name: "IP Adresi", value: `\`${MC_IP}\``, inline: true },
          { name: "Bedrock Port", value: `\`${MC_BEDROCK_PORT}\``, inline: true }
        )
        .setFooter({ text: `${BOT_NAME} • Canlı Sunucu Durumu` })
        .setTimestamp();
      return loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔴 CubixoraSMP — Sunucu Durumu")
        .addFields(
          { name: "Durum", value: "🔴 **Kapalı veya Bakımda**", inline: true },
          { name: "Açıklama", value: "Sunucu şu anda kapalı olabilir veya bakım aşamasındadır. Lütfen daha sonra tekrar deneyin.", inline: false },
          { name: "IP Adresi", value: `\`${MC_IP}\``, inline: true }
        )
        .setFooter({ text: `${BOT_NAME} • Sunucu Kapalı` })
        .setTimestamp();
      return loadingMsg.edit({ content: null, embeds: [embed] });
    }
  }

  let usedPrefix = content.startsWith(PREFIX) ? PREFIX : (content.startsWith("!") ? "!" : null);
  if (!usedPrefix) return;

  const args = content.slice(usedPrefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "botses") {
    let targetChannel;
    if (args[0]) {
      const channelId = args[0].replace(/[^0-9]/g, "");
      targetChannel = message.guild.channels.cache.get(channelId);
    } else {
      targetChannel = message.member.voice.channel;
    }

    if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
      return message.reply("❌ Lütfen geçerli bir ses kanalına gir veya komutla birlikte bir ses kanalının ID'sini belirt.");
    }

    try {
      joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      return message.reply(`🔊 Başarıyla **${targetChannel.name}** ses kanalına katıldım!`);
    } catch (e) {
      return message.reply("❌ Ses kanalına bağlanırken bir hata oluştu.");
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

    if (interaction.commandName === "restart") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Bu komutu yalnızca **Yöneticiler** kullanabilir!", ephemeral: true });
      }
      await interaction.reply({ content: "🔄 Bot yeniden başlatılıyor..." });
      setTimeout(() => { process.exit(0); }, 1000);
      return;
    }

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

    if (interaction.commandName === "müzikpanelyarat") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const channel = interaction.options.getChannel("kanal");

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("🎶 CubixoraSMP Müzik Paneli")
        .setDescription("Aşağıdaki butonları kullanarak ses kanalında müziği durdurabilir, devam ettirebilir veya bottan ayrılmasını sağlayabilirsin!")
        .setFooter({ text: `${BOT_NAME} • Müzik Sistemi` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("music_pause").setLabel("Durdur / Devam Et").setStyle(ButtonStyle.Primary).setEmoji("⏯️"),
        new ButtonBuilder().setCustomId("music_stop").setLabel("Ayrıl").setStyle(ButtonStyle.Danger).setEmoji("⏹️")
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Müzik paneli ${channel} kanalına başarıyla kuruldu!`, ephemeral: true });
    }

    if (interaction.commandName === "panelacmezük") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      const channel = interaction.options.getChannel("kanal");
      const sarkAdi = interaction.options.getString("şarkı") || "rastgele";

      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("🎧 Kesintisiz Rastgele Müzik Paneli")
        .setDescription(`Bu panele basarak botu ses kanalına çağırabilir ve otomatik olarak rastgele/kesintisiz müzik çalmasını sağlayabilirsin!`)
        .setFooter({ text: `${BOT_NAME} • Otomatik Müzik` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`play_continuous_${sarkAdi}`).setLabel("Sesi Aç ve Rastgele Başlat").setStyle(ButtonStyle.Success).setEmoji("▶️"),
        new ButtonBuilder().setCustomId("music_stop").setLabel("Kapat/Ayrıl").setStyle(ButtonStyle.Danger).setEmoji("⏹️")
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Otomatik rastgele müzik paneli ${channel} kanalına kuruldu!`, ephemeral: true });
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

    if (interaction.customId.startsWith("play_continuous_")) {
      let query = interaction.customId.replace("play_continuous_", "");
      const member = interaction.member;
      const channel = member.voice.channel;

      if (!channel) return interaction.reply({ content: "❌ Bu paneli kullanabilmek için önce bir ses kanalına girmelisin!", ephemeral: true });

      await interaction.deferReply({ ephemeral: true });

      // Eğer rastgele seçilmesi istendiyse listeden rastgele bir şarkı çek
      if (query === "rastgele" || !query) {
        query = randomPlaylist[Math.floor(Math.random() * randomPlaylist.length)];
      }

      try {
        const stream = ytdl(query, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream);
        const player = createAudioPlayer();

        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        connection.subscribe(player);
        player.play(resource);
        client.activeAudioPlayer = player;

        // Şarkı bittiğinde listeden tekrar rastgele başka bir şarkıya geçiş yap (Otomatik Döngü)
        player.on(AudioPlayerStatus.Idle, () => {
          try {
            const nextQuery = randomPlaylist[Math.floor(Math.random() * randomPlaylist.length)];
            const newStream = ytdl(nextQuery, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
            const newResource = createAudioResource(newStream);
            player.play(newResource);
          } catch {}
        });

        return interaction.editReply({ content: `🎧 Bot ses kanalına katıldı ve otomatik/rastgele müzik akışı başladı!` });
      } catch (e) {
        return interaction.editReply({ content: "❌ Şarkı açılırken bir hata oluştu veya link geçersiz." });
      }
    }
  }
});

client.login(process.env.TOKEN);
