import { Events } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing ${interaction.commandName}`);
      logger.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر.', ephemeral: true });
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('role_')) {
      await handleRoleButton(interaction);
    } else if (interaction.customId.startsWith('attend_') || interaction.customId.startsWith('decline_')) {
      await handleMeetingResponse(interaction);
    }
  }
}

async function handleRoleButton(interaction) {
  const roleId = interaction.customId.split('_')[1];
  const member = interaction.member;
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    return interaction.reply({ content: 'هذا الدور غير موجود.', ephemeral: true });
  }

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.reply({ content: `تمت إزالة دور ${role.name}.`, ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `تمت إضافة دور ${role.name}.`, ephemeral: true });
    }
  } catch (error) {
    logger.error('Error in role management:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تعديل الأدوار.', ephemeral: true });
  }
}

async function handleMeetingResponse(interaction) {
  const [action, meetingId] = interaction.customId.split('_');
  const userId = interaction.user.id;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      return interaction.reply({ content: 'لم يتم العثور على هذا الاجتماع.', ephemeral: true });
    }

    if (action === 'attend') {
      await prisma.meetingAttendee.upsert({
        where: {
          meetingId_userId: {
            meetingId: meetingId,
            userId: userId
          }
        },
        update: { status: 'ATTENDING' },
        create: {
          meetingId: meetingId,
          userId: userId,
          status: 'ATTENDING'
        }
      });
      await interaction.reply({ content: 'تم تسجيل حضورك للاجتماع.', ephemeral: true });
    } else if (action === 'decline') {
      await prisma.meetingAttendee.upsert({
        where: {
          meetingId_userId: {
            meetingId: meetingId,
            userId: userId
          }
        },
        update: { status: 'DECLINED' },
        create: {
          meetingId: meetingId,
          userId: userId,
          status: 'DECLINED'
        }
      });
      await interaction.reply({ content: 'تم تسجيل اعتذارك عن حضور الاجتماع.', ephemeral: true });
    }
  } catch (error) {
    logger.error('Error in meeting response:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تسجيل ردك على الاجتماع.', ephemeral: true });
  }
}

