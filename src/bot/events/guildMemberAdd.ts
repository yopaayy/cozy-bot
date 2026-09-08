// src/bot/events/guildMemberAdd.ts
import { Events, GuildMember } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';
import { config } from '../../shared/config';
import { prisma } from '../../shared/database';

export const event: Event<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  execute: async (client, member: GuildMember) => {
    // Ignore bots
    if (member.user.bot) return;

    logger.info(`[MemberJoin] User ${member.user.tag} (${member.id}) joined guild ${member.guild.name}`);

    try {
      // 1. Fetch unverified role from guild_config or env fallback
      const guildSettings = await prisma.guildConfig.findUnique({
        where: { guildId: member.guild.id },
      });

      const unverifiedRoleId = guildSettings?.unverifiedRoleId || config.UNVERIFIED_ROLE_ID;

      if (unverifiedRoleId) {
        const role = member.guild.roles.cache.get(unverifiedRoleId);
        if (role) {
          await member.roles.add(role);
          logger.info(`[Verification] Assigned @Unverified role to ${member.user.tag} (${member.id})`);
        } else {
          logger.warn(`[Verification] Unverified role ID ${unverifiedRoleId} not found in guild roles cache.`);
        }
      }

      // 2. Upsert user in database
      await prisma.users.upsert({
        where: { discordId: member.id },
        update: {
          username: member.user.username,
          updatedAt: new Date(),
        },
        create: {
          discordId: member.id,
          username: member.user.username,
          isVerified: false,
          joinedAt: member.joinedAt ?? new Date(),
        },
      });
    } catch (error) {
      logger.error({ err: error }, `[MemberJoin] Error processing guildMemberAdd for ${member.id}`);
    }
  },
};

export default event;
