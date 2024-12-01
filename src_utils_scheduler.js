import cron from 'node-cron';
import { prisma } from '../index.js';
import logger from './logger.js';
import moment from 'moment-timezone';
import { palestineTimezone } from '../config.js';

export function initializeScheduler(client) {
  cron.schedule('* * * * *', async () => {
    const currentTime = moment().tz(palestineTimezone);
    const timeString = currentTime.format('HH:mm');

    try {
      const autoOpenTasks = await prisma.autoOpen.findMany({
        where: {
          OR: [
            { openTime: timeString },
            { closeTime: timeString }
          ]
        }
      });

      for (const task of autoOpenTasks) {
        const guild = client.guilds.cache.get(task.guildId);
        if (!guild) continue;

        if (task.openTime === timeString) {
          await openRooms(guild, task);
        } else if (task.closeTime === timeString) {
          await closeRooms(guild, task);
        }
      }
    } catch (error) {
      logger.error('Error in scheduler:', error);
    }
  });
}

async function openRooms(guild, task) {
  const category = guild.channels.cache.get(task.categoryId);
  const memberRole = guild.roles.cache.get(task.memberRoleId);
  const doneRoom = guild.channels.cache.get(task.doneRoomId);

  if (!category || !memberRole || !doneRoom) {
    logger.error(`Missing category, member role, or done room for guild ${guild.id}`);
    return;
  }

  for (const channel of category.children.cache.values()) {
    await channel.permissionOverwrites.edit(memberRole, { ViewChannel: true });
  }

  const embed = {
    color: 0x0099ff,
    title: 'تم فتح الغرف',
    description: `تم فتح الغرف في الفئة ${category.name}.`,
    timestamp: new Date(),
    footer: {
      text: guild.name,
      icon_url: guild.iconURL(),
    },
  };

  if (task.image) {
    embed.image = { url: task.image };
  }

  await doneRoom.send({ embeds: [embed] });
  logger.info(`Opened rooms in category ${category.name} for guild ${guild.id}`);
}

async function closeRooms(guild, task) {
  const category = guild.channels.cache.get(task.categoryId);
  const memberRole = guild.roles.cache.get(task.memberRoleId);
  const doneRoom = guild.channels.cache.get(task.doneRoomId);

  if (!category || !memberRole || !doneRoom) {
    logger.error(`Missing category, member role, or done room for guild ${guild.id}`);
    return;
  }

  for (const channel of category.children.cache.values()) {
    await channel.permissionOverwrites.edit(memberRole, { ViewChannel: false });
  }

  const embed = {
    color: 0xFF0000,
    title: 'تم إغلاق الغرف',
    description: `تم إغلاق الغرف في الفئة ${category.name}.`,
    timestamp: new Date(),
    footer: {
      text: guild.name,
      icon_url: guild.iconURL(),
    },
  };

  if (task.image) {
    embed.image = { url: task.image };
  }

  await doneRoom.send({ embeds: [embed] });
  logger.info(`Closed rooms in category ${category.name} for guild ${guild.id}`);
}
