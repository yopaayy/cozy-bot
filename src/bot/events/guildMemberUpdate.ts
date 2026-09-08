// src/bot/events/guildMemberUpdate.ts
import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import type { Event } from '../../shared/types';
import { verificationService } from '../modules/verification/verification.service';
import { prisma } from '../../shared/database';
import { logger } from '../../shared/logger';
import { logAudit } from '../../shared/audit-logger';

export const event: Event<Events.GuildMemberUpdate> = {
  name: Events.GuildMemberUpdate,
  execute: async (client, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    try {
      const config = await verificationService.getConfig(newMember.guild.id);
      const verifiedRoleId = config.verifiedRoleId;
      const unverifiedRoleId = config.unverifiedRoleId;

      if (!verifiedRoleId) return;

      const hadVerified = oldMember.roles.cache.has(verifiedRoleId);
      const hasVerified = newMember.roles.cache.has(verifiedRoleId);

      // Case 1: Member received @Verified manually in Discord
      if (!hadVerified && hasVerified) {
        logger.info(`[MemberUpdate] Manual verification detected for ${newMember.user.tag} (${newMember.id})`);

        // If member still has @Unverified role, remove it automatically
        if (unverifiedRoleId && newMember.roles.cache.has(unverifiedRoleId)) {
          await newMember.roles.remove(unverifiedRoleId).catch(() => null);
          logger.info(`[MemberUpdate] Auto-removed @Unverified role from ${newMember.user.tag}`);
        }

        // Upsert user in database as verified
        await prisma.users.upsert({
          where: { discordId: newMember.id },
          update: {
            username: newMember.user.username,
            isVerified: true,
            updatedAt: new Date(),
          },
          create: {
            discordId: newMember.id,
            username: newMember.user.username,
            isVerified: true,
            joinedAt: newMember.joinedAt ?? new Date(),
          },
        });

        // Audit log
        await logAudit({
          actorDiscordId: 'manual_admin',
          action: 'member_verify',
          detail: {
            userId: newMember.id,
            userTag: newMember.user.tag,
            method: 'manual_role_assignment',
          },
          source: 'system',
        });

        // Update panel stats
        await verificationService.updatePanelStats(newMember.guild);
      }

      // Case 2: Member had @Verified removed manually in Discord
      if (hadVerified && !hasVerified) {
        logger.info(`[MemberUpdate] @Verified removed manually for ${newMember.user.tag} (${newMember.id})`);

        await prisma.users.updateMany({
          where: { discordId: newMember.id },
          data: {
            isVerified: false,
            updatedAt: new Date(),
          },
        });

        // Update panel stats
        await verificationService.updatePanelStats(newMember.guild);
      }
    } catch (err) {
      logger.error({ err }, `[MemberUpdate] Error handling role change for ${newMember.id}`);
    }
  },
};

export default event;
