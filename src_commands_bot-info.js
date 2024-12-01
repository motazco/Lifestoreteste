import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import moment from 'moment-timezone';
import { palestineTimezone } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('bot-info')
  .setDescription('عرض معلومات عن البوت');

export async function execute(interaction) {
  const client = interaction.client;
  const botUser = client.user;

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('معلومات البوت')
    .setThumbnail(botUser.displayAvatarURL())
    .addFields(
      { name: 'اسم البوت', value: botUser.username, inline: true },
      { name: 'معرف البوت', value: botUser.id, inline: true },
      { name: 'تاريخ الإنشاء', value: botUser.createdAt.toUTCString(), inline: true },
      { name: 'عدد السيرفرات', value: client.guilds.cache.size.toString(), inline: true },
      { name: 'عدد المستخدمين', value: client.users.cache.size.toString(), inline: true },
      { name: 'إصدار Discord.js', value: 'v14', inline: true },
      { name: 'الوقت في فلسطين', value: moment().tz(palestineTimezone).format('YYYY-MM-DD HH:mm:ss'), inline: true }
    )
    .setFooter({ text: 'شكراً لاستخدامك البوت!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

