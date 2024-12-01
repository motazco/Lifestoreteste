import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('auto-response')
  .setDescription('إدارة الردود التلقائية')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('إضافة رد تلقائي جديد')
      .addStringOption(option => option.setName('trigger').setDescription('الكلمة أو العبارة التي تفعل الرد').setRequired(true))
      .addStringOption(option => option.setName('response').setDescription('الرد التلقائي').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('إزالة رد تلقائي')
      .addStringOption(option => option.setName('trigger').setDescription('الكلمة أو العبارة المراد إزالتها').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('عرض قائمة الردود التلقائية'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'add':
      await addAutoResponse(interaction);
      break;
    case 'remove':
      await removeAutoResponse(interaction);
      break;
    case 'list':
      await listAutoResponses(interaction);
      break;
  }
}

async function addAutoResponse(interaction) {
  const trigger = interaction.options.getString('trigger');
  const response = interaction.options.getString('response');

  try {
    await prisma.autoResponse.create({
      data: {
        guildId: interaction.guildId,
        trigger: trigger,
        response: response
      }
    });

    await interaction.reply(`تمت إضافة الرد التلقائي بنجاح. الكلمة المفعلة: "${trigger}"`);
  } catch (error) {
    logger.error('Error in auto-response add:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء إضافة الرد التلقائي.', ephemeral: true });
  }
}

async function removeAutoResponse(interaction) {
  const trigger = interaction.options.getString('trigger');

  try {
    const deletedResponse = await prisma.autoResponse.deleteMany({
      where: {
        guildId: interaction.guildId,
        trigger: trigger
      }
    });

    if (deletedResponse.count > 0) {
      await interaction.reply(`تمت إزالة الرد التلقائي بنجاح. الكلمة المفعلة: "${trigger}"`);
    } else {
      await interaction.reply(`لم يتم العثور على رد تلقائي للكلمة المفعلة: "${trigger}"`);
    }
  } catch (error) {
    logger.error('Error in auto-response remove:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء إزالة الرد التلقائي.', ephemeral: true });
  }
}

async function listAutoResponses(interaction) {
  try {
    const autoResponses = await prisma.autoResponse.findMany({
      where: { guildId: interaction.guildId }
    });

    if (autoResponses.length === 0) {
      await interaction.reply('لا توجد ردود تلقائية مضافة حالياً.');
    } else {
      const responseList = autoResponses.map(ar => `- "${ar.trigger}": ${ar.response}`).join('\n');
      await interaction.reply(`الردود التلقائية الحالية:\n${responseList}`);
    }
  } catch (error) {
    logger.error('Error in auto-response list:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء جلب قائمة الردود التلقائية.', ephemeral: true });
  }
}

