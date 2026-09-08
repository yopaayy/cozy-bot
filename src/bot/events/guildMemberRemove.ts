// src/bot/events/guildMemberRemove.ts
import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';

export const event: Event<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  execute: async (client, member: GuildMember | PartialGuildMember) => {
    logger.info(`[MemberLeave] User ${member.user?.tag || member.id} left guild ${member.guild.name}`);
    // Welcome & Goodbye feature handler will attach here in Fase 2
  },
};

export default event;
