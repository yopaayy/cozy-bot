// src/bot/handlers/command-handler.ts
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { CozyClient } from '../client';
import type { Command } from '../../shared/types';
import { logger } from '../../shared/logger';

export async function loadCommands(client: CozyClient, commandsDir?: string): Promise<void> {
  const baseDir = commandsDir || path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(baseDir)) {
    return;
  }

  function getCommandFiles(dir: string): string[] {
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

  const commandFiles = getCommandFiles(baseDir);
  let loadedCount = 0;

  for (const file of commandFiles) {
    try {
      let module: any;
      try {
        module = require(file);
      } catch {
        module = await import(pathToFileURL(file).href);
      }
      const command: Command = module.default || module.command || module;

      if (command && command.data && typeof command.execute === 'function') {
        client.commands.set(command.data.name, command);
        loadedCount++;
      } else {
        logger.warn(`Skipping invalid command file: ${path.relative(baseDir, file)}`);
      }
    } catch (err) {
      logger.error({ err }, `Failed to load command from ${file}`);
    }
  }

  logger.info(`[CommandHandler] Successfully loaded ${loadedCount} command(s)`);
}
