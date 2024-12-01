import { SlashCommandBuilder } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('set-welcome')
  .setDescription('تعيين رسالة الترحيب وقناة الترحيب')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('القناة التي سيتم إرسال رسائل الترحيب إليها')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('message')
      .setDescription('رسالة الترحيب (استخدم {user} للإشارة إلى العضو و {server} لاسم السيرفر)')
      .setRequired(true));

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message');

  try {
    await prisma.welcomeMessage.upsert({
      where: { guildId: interaction.guildId },
      update: { channelId: channel.id, message },
      create: { guildId: interaction.guildId, channelId: channel.id, message },
    });

    await interaction.reply(`تم تعيين رسالة الترحيب في القناة ${channel}. الرسالة هي: ${message}`);
  } catch (error) {
    logger.error('Error in set-welcome command:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تعيين رسالة الترحيب.', ephemeral: true });
  }
}

