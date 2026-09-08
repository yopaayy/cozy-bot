// src/bot/events/messageReactionAdd.ts
import {
  Events,
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
} from 'discord.js';
import type { Event } from '../../shared/types';
import { verificationService } from '../modules/verification/verification.service';
import { logger } from '../../shared/logger';

export const event: Event<Events.MessageReactionAdd> = {
  name: Events.MessageReactionAdd,
  execute: async (
    client,
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) => {
    // 1. Partial checks
    let fullReaction: MessageReaction;
    if (reaction.partial) {
      try {
        fullReaction = await reaction.fetch();
      } catch (error) {
        logger.error({ err: error }, '[Reaction] Failed to fetch partial reaction:');
        return;
      }
    } else {
      fullReaction = reaction;
    }

    let fullUser: User;
    if (user.partial) {
      try {
        fullUser = await user.fetch();
      } catch (error) {
        logger.error({ err: error }, '[Reaction] Failed to fetch partial user:');
        return;
      }
    } else {
      fullUser = user;
    }

    // 2. Ignore bot reactions
    if (fullUser.bot) return;

    const guild = fullReaction.message.guild;
    if (!guild) return;

    // 3. Check verification config
    try {
      const config = await verificationService.getConfig(guild.id);

      const isVerifyMessage =
        config.messageId && fullReaction.message.id === config.messageId;
      const isVerifyChannel =
        config.channelId && fullReaction.message.channelId === config.channelId;

      if (!isVerifyMessage && !isVerifyChannel) {
        return;
      }

      const expectedEmoji = config.emoji || '✅';
      const actualEmoji = fullReaction.emoji.name;

      if (actualEmoji !== expectedEmoji) {
        return;
      }

      // 4. Fetch GuildMember
      const member = await guild.members.fetch(fullUser.id).catch(() => null);
      if (!member) {
        logger.warn(`[Verification] Member not found in guild for reaction user ${fullUser.id}`);
        return;
      }

      // 5. Execute Verification
      const result = await verificationService.verifyMember(guild, member, fullUser.id, 'discord_bot');

      if (!result.alreadyVerified) {
        // Send a friendly DM confirmation
        try {
          await fullUser.send(result.message);
        } catch {
          // If member has DMs closed, silently proceed
          logger.debug(`[Verification] Could not send DM to ${fullUser.tag} (DMs likely closed)`);
        }
      }
    } catch (error) {
      logger.error({ err: error }, `[Verification] Error processing verification reaction for ${fullUser.tag}`);
    }
  },
};

export default event;
