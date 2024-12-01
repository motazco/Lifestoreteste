import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('عرض تحذيرات مستخدم')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(option => 
    option.setName('user')
      .setDescription('المستخدم المراد عرض تحذيراته')
      .setRequired(true));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user');

  try {
    const warnings = await prisma.warning.findMany({
      where: {
        userId: targetUser.id,
        guildId: interaction.guildId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`تحذيرات ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription('هذا المستخدم ليس لديه أي تحذيرات.');
    } else {
      warnings.forEach((warning, index) => {
        embed.addFields({
          name: `تحذير #${index + 1}`,
          value: `السبب: ${warning.reason}\nبواسطة: <@${warning.moderatorId}>\nالتاريخ: ${warning.createdAt.toLocaleString()}`
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error in warnings command:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء جلب تحذيرات المستخدم.', ephemeral: true });
  }
}

