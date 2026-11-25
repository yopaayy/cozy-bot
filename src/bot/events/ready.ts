// src/bot/events/ready.ts
import { Events } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';

export const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client) => {
    logger.info(`[Bot] Cozy Bot online as ${client.user?.tag}! 🤍`);

    // Fetch and cache Application Emojis (Blackjack cards, chips, GIFs, etc.)
    try {
      if (client.application?.emojis) {
        await client.application.emojis.fetch();
        logger.info(`[Bot] Successfully loaded ${client.application.emojis.cache.size} Application Emojis into memory!`);
      }
    } catch (emojiErr) {
      logger.error({ err: emojiErr }, '[Bot] Failed to preload application emojis:');
    }


  },
};

export default event;
