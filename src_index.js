import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { checkReminders } from './jobs/checkReminders.js';
import { sendMeetingReminders } from './jobs/meetingReminders.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

export const prisma = new PrismaClient();

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// تشغيل وظيفة التحقق من التذكيرات كل دقيقة
setInterval(checkReminders, 60000);

// تشغيل وظيفة إرسال تذكيرات الاجتماعات كل 5 دقائق
setInterval(sendMeetingReminders, 300000);

client.login(process.env.DISCORD_TOKEN);

