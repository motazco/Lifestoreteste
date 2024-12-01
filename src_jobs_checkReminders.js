import { prisma } from '../index.js';
import { client } from '../index.js';
import logger from '../utils/logger.js';
import moment from 'moment-timezone';
import { palestineTimezone } from '../config.js';

export async function checkReminders() {
  try {
    const now = moment().tz(palestineTimezone);
    const reminders = await prisma.reminder.findMany({
      where: {
        reminderTime: {
          lte: now.toDate()
        }
      }
    });

    for (const reminder of reminders) {
      const user = await client.users.fetch(reminder.userId);
      const guild = await client.guilds.fetch(reminder.guildId);
      const channel = await guild.channels.fetch(reminder.channelId);

      if (user && channel) {
        await channel.send(`تذكير لـ ${user}: ${reminder.message}`);
      }

      await prisma.reminder.delete({
        where: { id: reminder.id }
      });
    }
  } catch (error) {
    logger.error('Error in checkReminders job:', error);
  }
}

