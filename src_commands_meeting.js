import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';
import moment from 'moment-timezone';
import { palestineTimezone } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('meeting')
  .setDescription('إدارة الاجتماعات')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
  .addSubcommand(subcommand =>
    subcommand
      .setName('schedule')
      .setDescription('جدولة اجتماع جديد')
      .addStringOption(option => option.setName('title').setDescription('عنوان الاجتماع').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('وصف الاجتماع').setRequired(true))
      .addStringOption(option => option.setName('date').setDescription('تاريخ الاجتماع (YYYY-MM-DD)').setRequired(true))
      .addStringOption(option => option.setName('time').setDescription('وقت الاجتماع (HH:MM)').setRequired(true))
      .addChannelOption(option => option.setName('channel').setDescription('القناة التي سيتم فيها الاجتماع').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('عرض قائمة الاجتماعات القادمة'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('cancel')
      .setDescription('إلغاء اجتماع مجدول')
      .addStringOption(option => option.setName('id').setDescription('معرف الاجتماع').setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'schedule':
      await scheduleMeeting(interaction);
      break;
    case 'list':
      await listMeetings(interaction);
      break;
    case 'cancel':
      await cancelMeeting(interaction);
      break;
  }
}

async function scheduleMeeting(interaction) {
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const date = interaction.options.getString('date');
  const time = interaction.options.getString('time');
  const channel = interaction.options.getChannel('channel');

  const dateTimeString = `${date} ${time}`;
  const meetingDateTime = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', palestineTimezone);

  if (meetingDateTime.isBefore(moment())) {
    return interaction.reply({ content: 'لا يمكن جدولة اجتماع في الماضي. يرجى اختيار وقت في المستقبل.', ephemeral: true });
  }

  try {
    const meeting = await prisma.meeting.create({
      data: {
        guildId: interaction.guildId,
        title: title,
        description: description,
        scheduledAt: meetingDateTime.toDate(),
        channelId: channel.id,
        createdBy: interaction.user.id
      }
    });

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('اجتماع جديد مجدول')
      .setDescription(description)
      .addFields(
        { name: 'العنوان', value: title },
        { name: 'التاريخ والوقت', value: meetingDateTime.format('YYYY-MM-DD HH:mm') },
        { name: 'القناة', value: channel.toString() },
        { name: 'المنظم', value: interaction.user.toString() }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`attend_${meeting.id}`)
          .setLabel('سأحضر')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`decline_${meeting.id}`)
          .setLabel('لن أحضر')
          .setStyle(ButtonStyle.Danger)
      );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply(`تم جدولة الاجتماع بنجاح. معرف الاجتماع: ${meeting.id}`);
  } catch (error) {
    logger.error('Error in meeting schedule:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء جدولة الاجتماع.', ephemeral: true });
  }
}

async function listMeetings(interaction) {
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        guildId: interaction.guildId,
        scheduledAt: {
          gte: new Date()
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    if (meetings.length === 0) {
      return interaction.reply('لا توجد اجتماعات قادمة مجدولة.');
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('الاجتماعات القادمة')
      .setTimestamp();

    meetings.forEach(meeting => {
      const meetingDateTime = moment(meeting.scheduledAt).tz(palestineTimezone);
      embed.addFields({
        name: meeting.title,
        value: `الوصف: ${meeting.description}\nالتاريخ والوقت: ${meetingDateTime.format('YYYY-MM-DD HH:mm')}\nالقناة: <#${meeting.channelId}>\nمعرف الاجتماع: ${meeting.id}`
      });
    });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error in meeting list:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء جلب قائمة الاجتماعات.', ephemeral: true });
  }
}

async function cancelMeeting(interaction) {
  const meetingId = interaction.options.getString('id');

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      return interaction.reply('لم يتم العثور على اجتماع بهذا المعرف.');
    }

    if (meeting.guildId !== interaction.guildId) {
      return interaction.reply('ليس لديك صلاحية لإلغاء هذا الاجتماع.');
    }

    await prisma.meeting.delete({
      where: { id: meetingId }
    });

    const channel = await interaction.guild.channels.fetch(meeting.channelId);
    if (channel) {
      await channel.send(`تم إلغاء الاجتماع "${meeting.title}" المجدول في ${moment(meeting.scheduledAt).tz(palestineTimezone).format('YYYY-MM-DD HH:mm')}.`);
    }

    await interaction.reply(`تم إلغاء الاجتماع بنجاح. معرف الاجتماع: ${meetingId}`);
  } catch (error) {
    logger.error('Error in meeting cancel:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء إلغاء الاجتماع.', ephemeral: true });
  }
}

