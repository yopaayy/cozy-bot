// src/bot/handlers/event-handler.ts
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { CozyClient } from '../client';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';

export async function loadEvents(client: CozyClient, eventsDir?: string): Promise<void> {
  const baseDir = eventsDir || path.join(__dirname, '..', 'events');
  if (!fs.existsSync(baseDir)) {
    return;
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  let loadedCount = 0;

  for (const entry of entries) {
    if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.d.ts')
    ) {
      const fullPath = path.join(baseDir, entry.name);
      try {
        let module: any;
        try {
          module = require(fullPath);
        } catch {
          module = await import(pathToFileURL(fullPath).href);
        }
        const event: Event = module.default || module.event || module;

        if (event && event.name && typeof event.execute === 'function') {
          if (event.once) {
            (client as any).once(event.name, (...args: any[]) => (event as any).execute(client, ...args));
          } else {
            (client as any).on(event.name, (...args: any[]) => (event as any).execute(client, ...args));
          }
          loadedCount++;
        } else {
          logger.warn(`Skipping invalid event file: ${entry.name}`);
        }
      } catch (err) {
        logger.error({ err }, `Failed to load event from ${fullPath}`);
      }
    }
  }

  logger.info(`[EventHandler] Successfully loaded ${loadedCount} event(s)`);
}
