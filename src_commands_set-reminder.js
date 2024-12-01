import { SlashCommandBuilder } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';
import moment from 'moment-timezone';
import { palestineTimezone } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('set-reminder')
  .setDescription('تعيين تذكير')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('رسالة التذكير')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('time')
      .setDescription('وقت التذكير (HH:MM)')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('date')
      .setDescription('تاريخ التذكير (YYYY-MM-DD)')
      .setRequired(false));

export async function execute(interaction) {
  const message = interaction.options.getString('message');
  const time = interaction.options.getString('time');
  const date = interaction.options.getString('date') || moment().tz(palestineTimezone).format('YYYY-MM-DD');

  // التحقق من صحة تنسيق الوقت والتاريخ
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!timeRegex.test(time) || !dateRegex.test(date)) {
    return interaction.reply({ content: 'تنسيق الوقت أو التاريخ غير صالح. يرجى استخدام HH:MM للوقت و YYYY-MM-DD للتاريخ.', ephemeral: true });
  }

  const reminderDateTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', palestineTimezone);
  if (reminderDateTime.isBefore(moment())) {
    return interaction.reply({ content: 'لا يمكن تعيين تذكير لوقت مضى. يرجى اختيار وقت في المستقبل.', ephemeral: true });
  }

  try {
    await prisma.reminder.create({
      data: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        message: message,
        reminderTime: reminderDateTime.toDate()
      }
    });

    await interaction.reply(`تم تعيين التذكير بنجاح لـ ${reminderDateTime.format('YYYY-MM-DD HH:mm')} بتوقيت فلسطين.`);
  } catch (error) {
    logger.error('Error in set-reminder command:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تعيين التذكير.', ephemeral: true });
  }
}

