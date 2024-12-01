import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('role-manager')
  .setDescription('إدارة الأدوار في السيرفر')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('إضافة دور قابل للاختيار')
      .addRoleOption(option => option.setName('role').setDescription('الدور المراد إضافته').setRequired(true))
      .addStringOption(option => option.setName('description').setDescription('وصف الدور').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('إزالة دور قابل للاختيار')
      .addRoleOption(option => option.setName('role').setDescription('الدور المراد إزالته').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('عرض قائمة الأدوار القابلة للاختيار'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('create-menu')
      .setDescription('إنشاء قائمة اختيار الأدوار'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'add':
      await addRole(interaction);
      break;
    case 'remove':
      await removeRole(interaction);
      break;
    case 'list':
      await listRoles(interaction);
      break;
    case 'create-menu':
      await createRoleMenu(interaction);
      break;
  }
}

async function addRole(interaction) {
  const role = interaction.options.getRole('role');
  const description = interaction.options.getString('description');

  try {
    await prisma.selectableRole.create({
      data: {
        guildId: interaction.guildId,
        roleId: role.id,
        description: description
      }
    });

    await interaction.reply(`تمت إضافة الدور ${role.name} إلى قائمة الأدوار القابلة للاختيار.`);
  } catch (error) {
    logger.error('Error in role-manager add:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء إضافة الدور.', ephemeral: true });
  }
}

async function removeRole(interaction) {
  const role = interaction.options.getRole('role');

  try {
    await prisma.selectableRole.delete({
      where: {
        guildId_roleId: {
          guildId: interaction.guildId,
          roleId: role.id
        }
      }
    });

    await interaction.reply(`تمت إزالة الدور ${role.name} من قائمة الأدوار القابلة للاختيار.`);
  } catch (error) {
    logger.error('Error in role-manager remove:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء إزالة الدور.', ephemeral: true });
  }
}

async function listRoles(interaction) {
  try {
    const roles = await prisma.selectableRole.findMany({
      where: { guildId: interaction.guildId }
    });

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('الأدوار القابلة للاختيار')
      .setDescription(roles.length ? 'قائمة الأدوار التي يمكن للأعضاء اختيارها:' : 'لا توجد أدوار قابلة للاختيار حالياً.')
      .addFields(
        roles.map(role => ({
          name: interaction.guild.roles.cache.get(role.roleId)?.name || 'دور غير موجود',
          value: role.description
        }))
      );

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error in role-manager list:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء استرجاع قائمة الأدوار.', ephemeral: true });
  }
}

async function createRoleMenu(interaction) {
  try {
    const roles = await prisma.selectableRole.findMany({
      where: { guildId: interaction.guildId }
    });

    if (roles.length === 0) {
      return interaction.reply('لا توجد أدوار قابلة للاختيار. أضف بعض الأدوار أولاً باستخدام أمر `/role-manager add`.');
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('اختر أدوارك')
      .setDescription('انقر على الأزرار أدناه لاختيار أو إزالة الأدوار.');

    const rows = [];
    for (let i = 0; i < roles.length; i += 5) {
      const row = new ActionRowBuilder();
      for (let j = i; j < Math.min(i + 5, roles.length); j++) {
        const role = interaction.guild.roles.cache.get(roles[j].roleId);
        if (role) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`role_${role.id}`)
              .setLabel(role.name)
              .setStyle(ButtonStyle.Primary)
          );
        }
      }
      rows.push(row);
    }

    await interaction.reply({ embeds: [embed], components: rows });
  } catch (error) {
    logger.error('Error in role-manager create-menu:', error);
    await interaction.reply({ content: 'حدث خطأ أثناء إنشاء قائمة الأدوار.', ephemeral: true });
  }
}

