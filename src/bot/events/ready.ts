// src/bot/events/ready.ts
import { ActivityType, Events } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';

export const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client) => {
    logger.info(`[Bot] Cozy Bot online as ${client.user?.tag}! 🤍`);

    try {
      client.user?.setPresence({
        activities: [
          {
            name: 'Cozy For Us 🤍',
            type: ActivityType.Custom,
            state: 'Vibing at Cozy For Us 🤍',
          },
        ],
        status: 'online',
      });
    } catch (presenceErr) {
      logger.warn({ err: presenceErr }, '[Bot] Could not set presence:');
    }

    // Fetch and cache verification panel messages across guilds
    try {
      const { prisma } = await import('../../shared/database');
      const configs = await prisma.guildConfig.findMany({
        where: {
          verifyChannelId: { not: null },
          verifyMessageId: { not: null },
        },
      });

      for (const conf of configs) {
        if (!conf.verifyChannelId || !conf.verifyMessageId) continue;
        const channel = await client.channels.fetch(conf.verifyChannelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const msg = await (channel as any).messages.fetch(conf.verifyMessageId).catch(() => null);
          if (msg) {
            logger.info(`[Bot] Successfully cached verification message ${conf.verifyMessageId} in #${(channel as any).name}`);
          }
        }
      }
    } catch (cacheErr) {
      logger.error({ err: cacheErr }, '[Bot] Failed to cache verification messages on startup:');
    }
  },
};

export default event;
