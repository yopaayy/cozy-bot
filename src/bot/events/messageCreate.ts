// src/bot/events/messageCreate.ts
import { Events, Message } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';

export const event: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  execute: async (client, message: Message) => {
    // Ignore bots or system messages
    if (message.author.bot || !message.guild) return;

    // Text Leveling XP tracking will attach here in Fase 4
  },
};

export default event;
