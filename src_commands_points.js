import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('points')
  .setDescription('عرض نقاطك أو نقاط مستخدم آخر')
  .addUserOption(option => 
    option.setName('user')
      .setDescription('المستخدم المراد عرض نقاطه')
      .setRequired(false));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;

  try {
    const userPoints = await prisma.userPoints.findUnique({
      where: {
        userId_guildId: {
          userId: targetUser.id,
          guildId: interaction.guildId
        }
      }
    });

    const points = userPoints ? userPoints.points : 0;

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('نقاط المستخدم')
      .setDescription(`نقاط ${targetUser.username}: ${points}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error in points command:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء جلب نقاط المستخدم.', ephemeral: true });
  }
}

