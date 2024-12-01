import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('عرض قائمة المتصدرين')
  .addIntegerOption(option => 
    option.setName('top')
      .setDescription('عدد الأعضاء المراد عرضهم')
      .setMinValue(1)
      .setMaxValue(25)
      .setRequired(false));

export async function execute(interaction) {
  const topCount = interaction.options.getInteger('top') || 10;

  try {
    const topUsers = await prisma.userPoints.findMany({
      where: { guildId: interaction.guildId },
      orderBy: { points: 'desc' },
      take: topCount
    });

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🏆 قائمة المتصدرين')
      .setDescription(`أفضل ${topCount} أعضاء في السيرفر`)
      .setTimestamp();

    for (let i = 0; i < topUsers.length; i++) {
      const user = await interaction.client.users.fetch(topUsers[i].userId);
      embed.addFields({ name: `#${i + 1} ${user.username}`, value: `النقاط: ${topUsers[i].points}` });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error in leaderboard command:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء جلب قائمة المتصدرين.', ephemeral: true });
  }
}

