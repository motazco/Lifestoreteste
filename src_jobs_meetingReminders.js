import { prisma } from '../index.js';
import { client } from '../index.js';
import logger from '../utils/logger.js';
import moment from 'moment-timezone';
import { palestineTimezone } from '../config.js';

export async function sendMeetingReminders() {
  try {
    const now = moment().tz(palestineTimezone);
    const thirtyMinutesFromNow = moment(now).add(30, 'minutes');

    const upcomingMeetings = await prisma.meeting.findMany({
      where: {
        scheduledAt: {
          gte: now.toDate(),
          lt: thirtyMinutesFromNow.toDate()
        }
      },
      include: {
        attendees: true
      }
    });

    for (const meeting of upcomingMeetings) {
      const channel = await client.channels.fetch(meeting.channelId);
      if (channel) {
        const attendees = meeting.attendees.filter(a => a.status === 'ATTENDING');
        const attendeesMention = attendees.map(a => `<@${a.userId}>`).join(', ');

        await channel.send(`تذكير: الاجتماع "${meeting.title}" سيبدأ خلال 30 دقيقة.\n\nالحاضرون: ${attendeesMention}`);
      }
    }
  } catch (error) {
    logger.error('Error in sendMeetingReminders job:', error);
  }
}

