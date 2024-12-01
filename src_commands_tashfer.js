import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { encryptionMap } from '../config.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('tashfer')
  .setDescription('يشفر رسالة ويرسلها إلى غرفة محددة')
  .addChannelOption(option => 
    option.setName('room')
      .setDescription('الغرفة التي سيتم إرسال الرسالة المشفرة إليها')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('image')
      .setDescription('رابط الصورة التي سيتم تضمينها في الرسالة')
      .setRequired(false));

export async function execute(interaction) {
  const room = interaction.options.getChannel('room');
  const imageUrl = interaction.options.getString('image');

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('رسالة مشفرة')
    .setDescription('انقر على الزر أدناه لتشفير رسالتك')
    .setTimestamp();

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('encrypt')
        .setLabel('شفر')
        .setStyle(ButtonStyle.Primary)
    );

  const message = await room.send({ embeds: [embed], components: [row] });

  const filter = i => i.customId === 'encrypt' && i.user.id === interaction.user.id;
  const collector = message.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async i => {
    await i.showModal({
      title: 'أدخل رسالتك',
      custom_id: 'encrypt_modal',
      components: [{
        type: 1,
        components: [{
          type: 4,
          custom_id: 'message',
          label: 'الرسالة المراد تشفيرها',
          style: 2,
          min_length: 1,
          max_length: 1000,
          placeholder: 'أدخل رسالتك هنا',
          required: true
        }]
      }]
    });

    try {
      const submitted = await i.awaitModalSubmit({ time: 60000, filter: i => i.user.id === interaction.user.id });
      const message = submitted.fields.getTextInputValue('message');
      const encryptedMessage = encryptMessage(message);

      const encryptedEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('رسالة مشفرة')
        .setDescription(encryptedMessage)
        .setTimestamp();

      if (imageUrl) {
        encryptedEmbed.setImage(imageUrl);
      }

      await submitted.reply({ embeds: [encryptedEmbed], ephemeral: true });
      await message.edit({ embeds: [encryptedEmbed], components: [] });
    } catch (error) {
      logger.error('Error in tashfer command:', error);
      await i.followUp({ content: 'حدث خطأ أثناء معالجة طلبك.', ephemeral: true });
    }
  });

  await interaction.reply({ content: 'تم إرسال رسالة التشفير إلى الغرفة المحددة.', ephemeral: true });
}

function encryptMessage(message) {
  return message.split(' ').map(word => {
    return encryptionMap[word.toLowerCase()] || word;
  }).join(' ');
}

