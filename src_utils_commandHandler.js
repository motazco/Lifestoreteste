import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerCommands(client) {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      client.commands.set(command.data.name, command);
      logger.info(`Registered command: ${command.data.name}`);
    } else {
      logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  const rest = new REST().setToken(config.token);

  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(config.applicationId),
      { body: commands },
    );

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Error refreshing commands:', error);
  }
}
