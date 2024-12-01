import dotenv from 'dotenv';
import { GatewayIntentBits, Partials } from 'discord.js';

dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN,
  applicationId: process.env.APPLICATION_ID,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
};

export const encryptionMap = {
  'بيع': 'بيــــ3',
  'حساب': '7ـــساب',
  // يمكنك إضافة المزيد من الكلمات هنا
};

export const palestineTimezone = 'Asia/Gaza';
