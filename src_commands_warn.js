import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('تحذير مستخدم')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(option => 
    option.setName('user')
      .setDescription('المستخدم المراد تحذيره')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('reason')
      .setDescription('سبب التحذير')
      .setRequired(true));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');

  try {
    await prisma.warning.create({
      data: {
        userId: targetUser.id,
        guildId: interaction.guildId,
        reason: reason,
        moderatorId: interaction.user.id
      }
    });

    await interaction.reply(`تم تحذير ${targetUser.username} بنجاح. السبب: ${reason}`);

    // إرسال رسالة خاصة للمستخدم المحذر
    try {
      await targetUser.send(`لقد تم تحذيرك في سيرفر ${interaction.guild.name}. السبب: ${reason}`);
    } catch (error) {
      logger.warn(`Couldn't send DM to ${targetUser.username}`);
    }
  } catch (error) {
    logger.error('Error in warn command:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء تحذير المستخدم.', ephemeral: true });
  }
}

