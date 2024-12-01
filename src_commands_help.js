import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('عرض قائمة بجميع الأوامر المتاحة');

export async function execute(interaction) {
  const commands = interaction.client.commands;
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('قائمة الأوامر المتاحة')
    .setDescription('هنا قائمة بجميع الأوامر المتاحة في البوت:')
    .setTimestamp()
    .setFooter({ text: 'استخدم / قبل كل أمر' });

  commands.forEach(command => {
    embed.addFields({ name: command.data.name, value: command.data.description });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

