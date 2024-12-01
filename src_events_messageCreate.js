import { Events } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';

export const name = Events.MessageCreate;

export async function execute(message) {
  if (message.author.bot) return;

  try {
    // إضافة نقاط للمستخدم
    await prisma.userPoints.upsertawait prisma.userPoints.upsert({
      where: {
        userId_guildId: {
          userId: message.author.id,
          guildId: message.guild.id
        }
      },
      update: {
        points: {
          increment: 1
        }
      },
      create: {
        userId: message.author.id,
        guildId: message.guild.id,
        points: 1
      }
    });

    // التحقق من الردود التلقائية
    const autoResponses = await prisma.autoResponse.findMany({
      where: { guildId: message.guild.id }
    });

    for (const ar of autoResponses) {
      if (message.content.toLowerCase().includes(ar.trigger.toLowerCase())) {
        await message.reply(ar.response);
        break; // نرد مرة واحدة فقط حتى لو تطابقت عدة كلمات مفعلة
      }
    }
  } catch (error) {
    logger.error('Error in messageCreate event:', error);
  }
}

