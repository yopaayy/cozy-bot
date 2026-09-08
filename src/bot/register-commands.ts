// src/bot/register-commands.ts
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { REST, Routes } from 'discord.js';
import { config } from '../shared/config';
import { logger } from '../shared/logger';
import type { Command } from '../shared/types';

async function registerCommands() {
  const commandsDir = path.join(__dirname, 'commands');
  const commands: any[] = [];

  function getCommandFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getCommandFiles(fullPath));
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
        !entry.name.endsWith('.test.ts') &&
        !entry.name.endsWith('.d.ts')
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const commandFiles = getCommandFiles(commandsDir);

  for (const file of commandFiles) {
    try {
      const module = await import(pathToFileURL(file).href);
      const command: Command = module.default || module.command;

      if (command && command.data) {
        commands.push(command.data.toJSON());
        logger.info(`Loaded command definition: ${command.data.name}`);
      }
    } catch (err) {
      logger.error({ err }, `Failed to load command file ${file}`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands...`);

    // Guild-based deployment for instantaneous update in development/server
    if (config.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.GUILD_ID),
        { body: commands },
      );
      logger.info(`Successfully registered commands for Guild ID: ${config.GUILD_ID}`);
    } else {
      await rest.put(
        Routes.applicationCommands(config.DISCORD_CLIENT_ID),
        { body: commands },
      );
      logger.info('Successfully registered global application commands.');
    }
  } catch (error) {
    logger.error({ err: error }, 'Error registering application commands:');
  }
}

if (require.main === module) {
  registerCommands().catch((err) => {
    logger.error({ err }, 'Unhandled exception during command registration:');
    process.exit(1);
  });
}

export { registerCommands };
