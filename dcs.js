Require("dotenv").config();

Const {
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

Const { 
  JoinVoiceChannel, 
  CreateAudioPlayer, 
  CreateAudioResource,
  AudioPlayerStatus 
} = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");
const util = require("minecraft-server-util");
const express = require("express"); // 🌐 HTTP sunucusu için eklendi

// --- 7/24 PİNG (EXPRESS) SUNUCUSU ---
Const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  Res.send("🤖 Cubixorasmp Bot 7/24 aktif ve çalışıyor!");
});

app.listen(PORT, () => {
  Console.log(`🌐 HTTP sunucusu ${PORT} portunda çalışıyor.`);
});
// ------------------------------------

Const client = new Client({
  Intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ],
  Partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

Const PREFIX = "e!";
Const BOT_NAME = "Cubixorasmp";

Const MC_IP = "cubixorasmp.play.hosting";
const MC_BEDROCK_PORT = 19132;
const JAVA_VERSION = "1.16.5 - 26.2";
const BEDROCK_VERSION = "1.26+";

Const guildSettings = new Map();
const guildOwners = new Map();

Function getSettings(guildId) {
  If (!guildSettings.has(guildId)) {
    GuildSettings.set(guildId, {
      WelcomeChannel: null,
      goodbyeChannel: null,
      dcCezaChannel: null,
      mcCezaChannel: null,
      mcSohbetChannel: null,
      aiChannel: null,
      protectedRoles: []
    });
  }
  Return guildSettings.get(guildId);
}

Function getOwners(guildId) {
  If (!guildOwners.has(guildId)) {
    GuildOwners.set(guildId, []);
  }
  Return guildOwners.get(guildId);
}

Function parseDuration(text) {
  If (!text) return null;
  Const match = text.toLowerCase().match(/^(\d+)(s|sn|m|dk|h|sa|d|g)$/);
  If (!match) return null;
  Const number = Number(match[1]);
  Const unit = match[2];
  Const map = {
    S: 1000, sn: 1000,
    M: 60 * 1000, dk: 60 * 1000,
    H: 60 * 60 * 1000, sa: 60 * 60 * 1000,
    D: 24 * 60 * 60 * 1000, g: 24 * 60 * 60 * 1000
  };
  Return number * (map[unit] || 1000);
}

Const slashCommands = [
  New SlashCommandBuilder().setName("ip").setDescription("Sunucu IP ve Sürüm bilgilerini gösterir"),
  New SlashCommandBuilder().setName("restart").setDescription("Botu yeniden başlatır (Yalnızca Yöneticiler)"),
  New SlashCommandBuilder().setName("hoşgeldin-kanal").setDescription("Hoşgeldin kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  New SlashCommandBuilder().setName("gülegüle-kanal").setDescription("Güle güle kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  New SlashCommandBuilder().setName("dc-ceza").setDescription("Discord ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  New SlashCommandBuilder().setName("mc-ceza").setDescription("Minecraft ceza log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  New SlashCommandBuilder().setName("mcsohbet").setDescription("Minecraft sohbet/giriş-çıkış log kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  New SlashCommandBuilder().setName("yapayzrakakal").setDescription("Yapay zeka sohbet kanalını ayarlar").addChannelOption(o => o.setName("kanal").setDescription("Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  
  New SlashCommandBuilder().setName("owner-ekle").setDescription("Sunucuya yeni bir owner ekler").addUserOption(o => o.setName("uye").setDescription("Owner yapılacak üye").setRequired(true)),
  New SlashCommandBuilder().setName("owner-çıkar").setDescription("Sunucudaki bir owner'ı çıkarır").addUserOption(o => o.setName("uye").setDescription("Ownerlıktan çıkarılacak üye").setRequired(true)),
  New SlashCommandBuilder().setName("owner-list").setDescription("Sunucudaki owner'ları listeler"),

  New SlashCommandBuilder().setName("korma-ekle").setDescription("Korunacak rolü sisteme ekler").addRoleOption(o => o.setName("rol").setDescription("Korunacak Rol").setRequired(true)),
  New SlashCommandBuilder().setName("korma-cikar").setDescription("Korunacak rolü sistemden çıkarır").addRoleOption(o => o.setName("rol").setDescription("Kaldırılacak Rol").setRequired(true)),
  New SlashCommandBuilder().setName("korma-list").setDescription("Korumalı rolleri listeler"),

  New SlashCommandBuilder().setName("ticket-kur")
    .setDescription("Ticket sistemi kurar")
    .addChannelOption(o => o.setName("kanal").setDescription("Kurulacak Kanal").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addRoleOption(o => o.setName("yetkili-rol").setDescription("Ticketlara bakacak yetkili rolü").setRequired(true))
    .addStringOption(o => o.setName("baslik").setDescription("Ticket Panel Başlığı").setRequired(true))
    .addStringOption(o => o.setName("aciklama").setDescription("Ticket Panel Açıklaması").setRequired(true)),

  New SlashCommandBuilder().setName("müzikpanelyarat").setDescription("Butonlu müzik kontrol paneli kurar").addChannelOption(o => o.setName("kanal").setDescription("Panelin kurulacağı kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  New SlashCommandBuilder().setName("panelacmezük").setDescription("Ses kanalına katılıp otomatik müzik çalmaya başlayan özel panel kurar").addChannelOption(o => o.setName("kanal").setDescription("Panelin kurulacağı kanal").addChannelTypes(ChannelType.GuildText).setRequired(true)).addStringOption(o => o.setName("şarkı").setDescription("Çalınacak şarkı adı veya linki").setRequired(true)),
  New SlashCommandBuilder().setName("çal").setDescription("Müzik çalar").addStringOption(o => o.setName("şarkı").setDescription("Şarkı adı veya YouTube linki").setRequired(true)),
  New SlashCommandBuilder().setName("durdur").setDescription("Çalan müziği durdurur/oynatır"),
  New SlashCommandBuilder().setName("ayrıl").setDescription("Botu ses kanalından çıkarır")
];

Client.once("ready", async () => {
  Console.log(`${BOT_NAME} aktif!`);
  Client.user.setPresence({
    Activities: [{ name: "CubixoraSMP | !ip ve !aktif", type: ActivityType.Watching }],
    Status: "online"
  });

  For (const guild of client.guilds.cache.values()) {
    Try {
      Await guild.commands.set(slashCommands.map(c => c.toJSON()));
    } catch {}
  }
});

Client.on("guildMemberAdd", async member => {
  Const settings = getSettings(member.guild.id);
  If (settings.mcSohbetChannel) {
    Const channel = member.guild.channels.cache.get(settings.mcSohbetChannel);
    If (channel) channel.send(`🎮 [Sunucu] **${member.user.tag}** sunucuya katıldı! (Bedrock/Java Giriş)`);
  }
  If (!settings.welcomeChannel) return;
  Const channel = member.guild.channels.cache.get(settings.welcomeChannel);
  If (!channel) return;

  Const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("👋 Hoş Geldin!")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`**${member.user.tag}** sunucumuza hoş geldin!\n\nToplam üye: **${member.guild.memberCount}**`)
    .setFooter({ text: `${BOT_NAME} • Hoşgeldin` })
    .setTimestamp();
  Channel.send({ embeds: [embed] });
});

Client.on("guildMemberRemove", async member => {
  Const settings = getSettings(member.guild.id);
  If (settings.mcSohbetChannel) {
    Const channel = member.guild.channels.cache.get(settings.mcSohbetChannel);
    If (channel) channel.send(`🎮 [Sunucu] **${member.user.tag}** sunucudan ayrıldı.`);
  }
  If (!settings.goodbyeChannel) return;
  Const channel = member.guild.channels.cache.get(settings.goodbyeChannel);
  If (!channel) return;

  Const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("👋 Güle Güle!")
    .setDescription(`**${member.user.tag}** sunucudan ayrıldı.\n\nKalan üye: **${member.guild.memberCount}**`)
    .setFooter({ text: `${BOT_NAME} • Güle Güle` })
    .setTimestamp();
  Channel.send({ embeds: [embed] });
});

Client.on("messageCreate", async message => {
  If (!message.guild || message.author.bot) return;
  Const settings = getSettings(message.guild.id);
  Const content = message.content;
  Const lower = content.toLowerCase().trim();

  If (settings.aiChannel && message.channel.id === settings.aiChannel) {
    Const responses = [
      "Anladım, bu konuda sana katılıyorum! 🤖",
      "Gerçekten mi? Harika bir düşünce! ✨",
      "CubixoraSMP sunucumuz için en iyisini yapmaya devam ediyoruz! 🚀",
      `Hmm, ${message.author.username}, bunu biraz daha açar mısın? 🤔`,
      "Bunu duyduğuma sevindim! Başka nasıl yardımcı olabilirim? 💡"
    ];
    Const randomResp = responses[Math.floor(Math.random() * responses.length)];
    Return message.reply(randomResp);
  }

  If (["sa", "s.a", "selam", "selamün aleyküm", "selamun aleykum", "selamin aleykum"].includes(lower)) {
    Return message.reply("Aleyküm Selam, hoş geldin! 👋");
  }

  If (lower === "!aktif") {
    Const loadingMsg = await message.reply("🔍 Minecraft sunucu durumu kontrol ediliyor...");
    Try {
      Const response = await util.status(MC_IP, 25565, { timeout: 3000 });
      Const embed = new EmbedBuilder()
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
      Return loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (e) {
      Const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔴 CubixoraSMP — Sunucu Durumu")
        .addFields(
          { name: "Durum", value: "🔴 **Kapalı veya Bakımda**", inline: true },
          { name: "Açıklama", value: "Sunucu şu anda kapalı olabilir veya bakım aşamasındadır. Lütfen daha sonra tekrar deneyin.", inline: false },
          { name: "IP Adresi", value: `\`${MC_IP}\``, inline: true }
        )
        .setFooter({ text: `${BOT_NAME} • Sunucu Kapalı` })
        .setTimestamp();
      Return loadingMsg.edit({ content: null, embeds: [embed] });
    }
  }

  Let usedPrefix = content.startsWith(PREFIX) ? PREFIX : (content.startsWith("!") ? "!" : null);
  If (!usedPrefix) return;

  Const args = content.slice(usedPrefix.length).trim().split(/\s+/);
  Const command = args.shift()?.toLowerCase();

  If (command === "sil") {
    If (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("❌ Bu komut için Mesajları Yönet yetkin olmalı.");
    Const count = parseInt(args[0]);
    If (!count || count < 1 || count > 100) return message.reply("⚠️ Lütfen 1 ile 100 arasında bir sayı gir.");
    Try {
      Await message.channel.bulkDelete(count, true);
      Const m = await message.channel.send(`✅ **${count}** adet mesaj silindi.`);
      SetTimeout(() => m.delete().catch(() => {}), 4000);
    } catch {
      Message.reply("❌ Mesajlar silinemedi (14 günden eski mesajlar toplu silinemez).");
    }
  }

  If (command === "ban") {
    If (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply("❌ Üyeleri Yasakla yetkin yok.");
    Const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    If (!targetMember) return message.reply("⚠️ Lütfen banlanacak üyeyi etiketle (`!ban @kullanıcı [sebep]`).");
    
    Args.shift();
    Const sebep = args.join(" ") || "Sebep belirtilmedi";

    If (!targetMember.bannable) return message.reply("❌ Bu kullanıcıyı banlayamam (Yetkisi benden üstün).");

    Try {
      Await targetMember.ban({ reason: sebep });
      Message.reply(`✅ **${targetMember.user.tag}** sunucudan banlandı.`);

      If (settings.dcCezaChannel) {
        Const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);
        If (logChan) {
          Const embed = new EmbedBuilder().setColor(0xed4245).setTitle("🔨 YETKİLİ BAN")
            .addFields({ name: "👤 Banlanan", value: `${targetMember.user}` }, { name: "🛡️ Yetkili", value: `${message.author}` }, { name: "Sebep", value: sebep }).setTimestamp();
          LogChan.send({ embeds: [embed] });
        }
      }
    } catch (e) {
      Message.reply("❌ Ban işlemi başarısız oldu.");
    }
  }

  If (command === "mute") {
    If (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply("❌ Üyeleri Sustur yetkin yok.");
    Const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    If (!targetMember) return message.reply("⚠️ Kullanım: `!mute @kullanıcı [süre örn: 30m] [sebep]`");

    Args.shift();
    Const süreStr = args.shift();
    Const sebep = args.join(" ") || "Sebep belirtilmedi";

    Const msDuration = parseDuration(süreStr);
    If (!msDuration) return message.reply("❌ Geçersiz süre formatı! (Örn: `30m`, `1h`, `1d`)");

    Try {
      Await targetMember.timeout(msDuration, sebep);
      Message.reply(`✅ **${targetMember.user.tag}** başarıyla **${süreStr}** süreyle susturuldu.`);

      If (settings.dcCezaChannel) {
        Const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);
        If (logChan) {
          Const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle("🔇 YETKİLİ MUTE (SUSTURMA)")
            .addFields({ name: "👤 Susturulan", value: `${targetMember.user}` }, { name: "Süre", value: süreStr }, { name: "Yetkili", value: `${message.author}` }, { name: "Sebep", value: sebep }).setTimestamp();
          LogChan.send({ embeds: [embed] });
        }
      }
    } catch (e) {
      Message.reply("❌ Susturma işlemi başarısız oldu.");
    }
  }

  If (command === "unmute") {
    If (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply("❌ Üyeleri Sustur yetkin yok.");
    Const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    If (!targetMember) return message.reply("⚠️ Kullanım: `!unmute @kullanıcı`");

    Try {
      Await targetMember.timeout(null);
      Message.reply(`✅ **${targetMember.user.tag}** adlı kullanıcının susturulması kaldırıldı.`);

      If (settings.dcCezaChannel) {
        Const logChan = message.guild.channels.cache.get(settings.dcCezaChannel);
        If (logChan) {
          Const embed = new EmbedBuilder().setColor(0x2ecc71).setTitle("🔊 UNMUTE (SUSTURMA KALDIRILDI)")
            .addFields({ name: "👤 Susturması Kaldırılan", value: `${targetMember.user}` }, { name: "Yetkili", value: `${message.author}` }).setTimestamp();
          LogChan.send({ embeds: [embed] });
        }
      }
    } catch (e) {
      Message.reply("❌ Susturma kaldırılırken bir hata oluştu.");
    }
  }

  If (command === "ip") {
    Const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🌍 CubixoraSMP IP ve Sürüm Bilgisi")
      .addFields(
        { name: "☕ Java Sürüm & IP", value: `IP: \`${MC_IP}\`\nSürüm: \`${JAVA_VERSION}\`` },
        { name: "📱 Bedrock Sürüm, IP & Port", value: `IP: \`${MC_IP}\`\nPort: \`${MC_BEDROCK_PORT}\`\nSürüm: \`${BEDROCK_VERSION}\`` }
      );
    Return message.reply({ embeds: [embed] });
  }
});

Client.on("interactionCreate", async interaction => {
  If (interaction.isChatInputCommand()) {
    Const guild = interaction.guild;
    Const member = interaction.member;
    Const settings = getSettings(guild.id);

    If (interaction.commandName === "restart") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        Return interaction.reply({ content: "❌ Bu komutu yalnızca **Yöneticiler** kullanabilir!", ephemeral: true });
      }
      Await interaction.reply({ content: "🔄 Bot yeniden başlatılıyor..." });
      SetTimeout(() => { process.exit(0); }, 1000);
      Return;
    }

    If (interaction.commandName === "ip") {
      Const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🌍 CubixoraSMP IP ve Sürüm Bilgisi")
        .addFields(
          { name: "☕ Java Sürüm & IP", value: `IP: \`${MC_IP}\`\nSürüm: \`${JAVA_VERSION}\`` },
          { name: "📱 Bedrock Sürüm, IP & Port", value: `IP: \`${MC_IP}\`\nPort: \`${MC_BEDROCK_PORT}\`\nSürüm: \`${BEDROCK_VERSION}\`` }
        );
      Return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    If (interaction.commandName === "owner-ekle") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      Const targetUser = interaction.options.getUser("uye");
      Const owners = getOwners(guild.id);
      If (owners.includes(targetUser.id)) return interaction.reply({ content: `⚠️ ${targetUser} zaten owner listesinde!`, ephemeral: true });
      Owners.push(targetUser.id);
      Return interaction.reply({ content: `✅ ${targetUser} owner listesine eklendi!` });
    }

    If (interaction.commandName === "owner-çıkar") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      Const targetUser = interaction.options.getUser("uye");
      Let owners = getOwners(guild.id);
      If (!owners.includes(targetUser.id)) return interaction.reply({ content: `⚠️ ${targetUser} listede yok.`, ephemeral: true });
      GuildOwners.set(guild.id, owners.filter(id => id !== targetUser.id));
      Return interaction.reply({ content: `✅ ${targetUser} owner listesinden çıkarıldı.` });
    }

    If (interaction.commandName === "owner-list") {
      Const owners = getOwners(guild.id);
      If (owners.length === 0) return interaction.reply({ content: "⚠️ Kayıtlı owner yok.", ephemeral: true });
      Const ownerTags = owners.map(id => `<@${id}>`).join("\n");
      Const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle(`👑 ${guild.name} — Owner Listesi`).setDescription(ownerTags).setTimestamp();
      Return interaction.reply({ embeds: [embed] });
    }

    If (interaction.commandName === "korma-ekle") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      Const role = interaction.options.getRole("rol");
      If (settings.protectedRoles.includes(role.id)) return interaction.reply({ content: `⚠️ Bu rol zaten korumalı listede!`, ephemeral: true });
      Settings.protectedRoles.push(role.id);
      Return interaction.reply({ content: `✅ ${role} başarıyla korumalı rollere eklendi.` });
    }

    If (interaction.commandName === "korma-cikar") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      Const role = interaction.options.getRole("rol");
      If (!settings.protectedRoles.includes(role.id)) return interaction.reply({ content: `⚠️ Bu rol korumalı listede bulunmuyor.`, ephemeral: true });
      Settings.protectedRoles = settings.protectedRoles.filter(id => id !== role.id);
      Return interaction.reply({ content: `✅ ${role} korumalı rollerden çıkarıldı.` });
    }

    If (interaction.commandName === "korma-list") {
      If (settings.protectedRoles.length === 0) return interaction.reply({ content: "⚠️ Korumalı rol bulunmuyor.", ephemeral: true });
      Const roleTags = settings.protectedRoles.map(id => `<@&${id}>`).join("\n");
      Const embed = new EmbedBuilder().setColor(0xe74c3c).setTitle("🛡️ Korumalı Roller Listesi").setDescription(roleTags).setTimestamp();
      Return interaction.reply({ embeds: [embed] });
    }

    If (interaction.commandName === "müzikpanelyarat") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      Const channel = interaction.options.getChannel("kanal");

      Const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("🎶 CubixoraSMP Müzik Paneli")
        .setDescription("Aşağıdaki butonları kullanarak ses kanalında müziği durdurabilir, devam ettirebilir veya bottan ayrılmasını sağlayabilirsin!")
        .setFooter({ text: `${BOT_NAME} • Müzik Sistemi` });

      Const row = new ActionRowBuilder().addComponents(
        New ButtonBuilder().setCustomId("music_pause").setLabel("Durdur / Devam Et").setStyle(ButtonStyle.Primary).setEmoji("⏯️"),
        New ButtonBuilder().setCustomId("music_stop").setLabel("Ayrıl").setStyle(ButtonStyle.Danger).setEmoji("⏹️")
      );

      Await channel.send({ embeds: [embed], components: [row] });
      Return interaction.reply({ content: `✅ Müzik paneli ${channel} kanalına başarıyla kuruldu!`, ephemeral: true });
    }

    If (interaction.commandName === "panelacmezük") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "❌ Yönetici olmalısın.", ephemeral: true });
      Const channel = interaction.options.getChannel("kanal");
      Const sarkAdi = interaction.options.getString("şarkı");

      Const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("🎧 Kesintisiz Müzik Paneli")
        .setDescription(`Bu panel üzerinden botu ses kanalına çağırıp **${sarkAdi}** şarkısını sürekli çalmasını sağlayabilirsin!`)
        .setFooter({ text: `${BOT_NAME} • Sürekli Müzik` });

      Const row = new ActionRowBuilder().addComponents(
        New ButtonBuilder().setCustomId(`play_continuous_${sarkAdi}`).setLabel("Sesi Aç ve Müziği Başlat").setStyle(ButtonStyle.Success).setEmoji("▶️"),
        New ButtonBuilder().setCustomId("music_stop").setLabel("Kapat/Ayrıl").setStyle(ButtonStyle.Danger).setEmoji("⏹️")
      );

      Await channel.send({ embeds: [embed], components: [row] });
      Return interaction.reply({ content: `✅ Sürekli müzik paneli ${channel} kanalına kuruldu!`, ephemeral: true });
    }

    If (interaction.commandName === "ticket-kur") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yönetici olmalısın.", ephemeral: true });
      Const channel = interaction.options.getChannel("kanal");
      Const yetkiliRol = interaction.options.getRole("yetkili-rol");
      Const baslik = interaction.options.getString("baslik");
      Const aciklama = interaction.options.getString("aciklama");

      Const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎫 ${baslik}`)
        .setDescription(aciklama)
        .setFooter({ text: `${BOT_NAME} • Yetkili Rol: ${yetkiliRol.name}` })
        .setTimestamp();

      Const row = new ActionRowBuilder().addComponents(
        New ButtonBuilder().setCustomId(`create_ticket_${yetkiliRol.id}`).setLabel("Destek Talebi Aç").setStyle(ButtonStyle.Primary).setEmoji("🎫")
      );

      Await channel.send({ embeds: [embed], components: [row] });
      Return interaction.reply({ content: `✅ Ticket paneli ${channel} kanalına kuruldu! Yetkili Rol: **${yetkiliRol.name}**`, ephemeral: true });
    }

    If (interaction.commandName === "hoşgeldin-kanal") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      Settings.welcomeChannel = interaction.options.getChannel("kanal").id;
      Return interaction.reply({ content: "✅ Hoşgeldin kanalı ayarlandı.", ephemeral: true });
    }

    If (interaction.commandName === "gülegüle-kanal") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      Settings.goodbyeChannel = interaction.options.getChannel("kanal").id;
      Return interaction.reply({ content: "✅ Güle güle kanalı ayarlandı.", ephemeral: true });
    }

    If (interaction.commandName === "dc-ceza") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      Settings.dcCezaChannel = interaction.options.getChannel("kanal").id;
      Return interaction.reply({ content: "✅ Discord ceza log kanalı ayarlandı.", ephemeral: true });
    }

    If (interaction.commandName === "mc-ceza") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      Settings.mcCezaChannel = interaction.options.getChannel("kanal").id;
      Return interaction.reply({ content: "✅ Minecraft ceza log kanalı ayarlandı.", ephemeral: true });
    }

    If (interaction.commandName === "mcsohbet") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      Settings.mcSohbetChannel = interaction.options.getChannel("kanal").id;
      Return interaction.reply({ content: "✅ Minecraft sohbet kanalı ayarlandı.", ephemeral: true });
    }

    If (interaction.commandName === "yapayzrakakal") {
      If (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
      Settings.aiChannel = interaction.options.getChannel("kanal").id;
      Return interaction.reply({ content: "✅ Yapay zeka sohbet kanalı başarıyla ayarlandı!", ephemeral: true });
    }

    If (interaction.commandName === "çal") {
      Const channel = member.voice.channel;
      If (!channel) return interaction.reply({ content: "❌ Önce bir ses kanalına girmelisin!", ephemeral: true });

      Const query = interaction.options.getString("şarkı");
      Await interaction.deferReply();

      Try {
        Const stream = ytdl(query, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
        Const resource = createAudioResource(stream);
        Const player = createAudioPlayer();

        Const connection = joinVoiceChannel({
          ChannelId: channel.id,
          GuildId: guild.id,
          AdapterCreator: guild.voiceAdapterCreator,
        });

        Connection.subscribe(player);
        Player.play(resource);

        Client.activeAudioPlayer = player;

        Return interaction.editReply(`🎶 Çalınıyor: **${query}**`);
      } catch (e) {
        Return interaction.editReply("❌ Şarkı oynatılırken bir hata oluştu veya link geçersiz.");
      }
    }

    If (interaction.commandName === "durdur") {
      If (client.activeAudioPlayer) {
        If (client.activeAudioPlayer.state.status === AudioPlayerStatus.Playing) {
          Client.activeAudioPlayer.pause();
          Return interaction.reply({ content: "⏸️ Müzik durduruldu.", ephemeral: true });
        } else {
          Client.activeAudioPlayer.unpause();
          Return interaction.reply({ content: "▶️ Müzik devam ettiriliyor.", ephemeral: true });
        }
      }
      Return interaction.reply({ content: "❌ Aktif çalan bir müzik yok.", ephemeral: true });
    }

    If (interaction.commandName === "ayrıl") {
      Const connection = require("@discordjs/voice").getVoiceConnection(guild.id);
      If (connection) {
        Connection.destroy();
        Return interaction.reply({ content: "👋 Ses kanalından ayrıldım." });
      }
      Return interaction.reply({ content: "❌ Zaten bir ses kanalında değilim.", ephemeral: true });
    }
  }

  If (interaction.isButton()) {
    If (interaction.customId === "music_pause") {
      If (client.activeAudioPlayer) {
        If (client.activeAudioPlayer.state.status === AudioPlayerStatus.Playing) {
          Client.activeAudioPlayer.pause();
          Return interaction.reply({ content: "⏸️ Müzik durduruldu.", ephemeral: true });
        } else {
          Client.activeAudioPlayer.unpause();
          Return interaction.reply({ content: "▶️ Müzik devam ettiriliyor.", ephemeral: true });
        }
      }
      Return interaction.reply({ content: "❌ Aktif çalan bir müzik yok.", ephemeral: true });
    }

    If (interaction.customId === "music_stop") {
      Const connection = require("@discordjs/voice").getVoiceConnection(interaction.guild.id);
      If (connection) {
        Connection.destroy();
        Return interaction.reply({ content: "⏹️ Müzik durduruldu ve ses kanalından ayrıldı.", ephemeral: true });
      }
      Return interaction.reply({ content: "❌ Bot zaten ses kanalında değil.", ephemeral: true });
    }

    If (interaction.customId.startsWith("play_continuous_")) {
      Const query = interaction.customId.replace("play_continuous_", "");
      Const member = interaction.member;
      Const channel = member.voice.channel;

      If (!channel) return interaction.reply({ content: "❌ Bu paneli kullanabilmek için önce bir ses kanalına girmelisin!", ephemeral: true });

      Await interaction.deferReply({ ephemeral: true });

      Try {
        Const stream = ytdl(query, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
        Const resource = createAudioResource(stream);
        Const player = createAudioPlayer();

        Const connection = joinVoiceChannel({
          ChannelId: channel.id,
          GuildId: interaction.guild.id,
          AdapterCreator: interaction.guild.voiceAdapterCreator,
        });

        Connection.subscribe(player);
        Player.play(resource);

        Client.activeAudioPlayer = player;

        Player.on(AudioPlayerStatus.Idle, () => {
          Try {
            Const newStream = ytdl(query, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
            Const newResource = createAudioResource(newStream);
            Player.play(newResource);
          } catch {}
        });

        Return interaction.editReply({ content: `🎧 Bot ses kanalına katıldı ve **${query}** kesintisiz çalmaya başladı!` });
      } catch (e) {
        Return interaction.editReply({ content: "❌ Şarkı açılırken bir hata oluştu veya link geçersiz." });
      }
    }

    If (interaction.customId.startsWith("create_ticket_")) {
      Const userOpenTickets = interaction.guild.channels.cache.filter(
        Ch => ch.name.startsWith("ticket-") && ch.permissionOverwrites.cache.has(interaction.user.id)
      );

      If (userOpenTickets.size >= 5) {
        Return interaction.reply({ content: "⚠️ Aynı anda en fazla **5 adet** açık destek talebine sahip olabilirsin!", ephemeral: true });
      }

      Await interaction.deferReply({ ephemeral: true });
      Const roleId = interaction.customId.split("_")[2];

      Const ticketChan = await interaction.guild.channels.create({
        Name: `ticket-${interaction.user.username}`,
        Type: ChannelType.GuildText,
        PermissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: roleId, allow: [PermissionsBitField.FindFlags?.ViewChannel || PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
      });

      Const row = new ActionRowBuilder().addComponents(
        New ButtonBuilder().setCustomId("claim_ticket").setLabel("Talebi Üstlen").setStyle(ButtonStyle.Success).setEmoji("🙋‍♂️"),
        New ButtonBuilder().setCustomId("close_ticket").setLabel("Talebi Kapat").setStyle(ButtonStyle.Danger).setEmoji("🔒")
      );
      
      Await ticketChan.send({ 
        Content: `👋 Merhaba ${interaction.user}! <@&${roleId}> ekibimiz seninle ilgilenmek için birazdan burada olacak.\n🚀 **Çok yakında harika yenilikler ve sürprizlerle geliyoruz, takipte kalın!**`, 
        Components: [row] 
      });
      
      Return interaction.editReply({ content: `✅ Destek odan açıldı: ${ticketChan}` });
    }

    If (interaction.customId === "claim_ticket") {
      Await interaction.reply({ content: `🙋‍♂️ Bu destek talebi **${interaction.user.tag}** tarafından üstlenildi!` });
    }

    If (interaction.customId === "close_ticket") {
      Await interaction.reply({ content: "🔒 Talep kapatılıyor..." });
      SetTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
  }
});

Client.login(process.env.TOKEN);
