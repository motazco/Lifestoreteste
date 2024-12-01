import { Events } from 'discord.js';
import { prisma } from '../index.js';
import logger from '../utils/logger.js';
import { createWelcomeImage } from '../utils/imageGenerator.js';

export const name = Events.GuildMemberAdd;

export async function execute(member) {
  try {
    const welcomeMessage = await prisma.welcomeMessage.findUnique({
      where: { guildId: member.guild.id },
    });

    if (welcomeMessage) {
      const channel = member.guild.channels.cache.get(welcomeMessage.channelId);
      if (channel) {
        const welcomeImage = await createWelcomeImage(member);
        const message = welcomeMessage.message
          .replace('{user}', member.toString())
          .replace('{server}', member.guild.name);

        await channel.send({
          content: message,
          files: [{ attachment: welcomeImage, name: 'welcome.png' }],
        });
      }
    }
  } catch (error) {
    logger.error('Error in guildMemberAdd event:', error);
  }
}

