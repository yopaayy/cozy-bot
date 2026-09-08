// src/bot/modules/verification/verification.service.ts
import { Guild, GuildMember, TextChannel, Message } from 'discord.js';
import { prisma } from '../../../shared/database';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/logger';
import { logAudit } from '../../../shared/audit-logger';
import { createCozyEmbed } from '../../utils/embed-builder';
import type { VerificationConfig, VerifyMemberResult } from './verification.types';

export class VerificationService {
  /**
   * Get verification configuration for a guild
   */
  async getConfig(guildId: string): Promise<VerificationConfig> {
    const record = await prisma.guildConfig.findUnique({
      where: { guildId },
    });

    return {
      channelId: record?.verifyChannelId || null,
      emoji: record?.verifyEmoji || '✅',
      messageId: record?.verifyMessageId || null,
      unverifiedRoleId: record?.unverifiedRoleId || config.UNVERIFIED_ROLE_ID || null,
      verifiedRoleId: record?.verifiedRoleId || config.VERIFIED_ROLE_ID || null,
    };
  }

  /**
   * Update verification configuration for a guild
   */
  async updateConfig(guildId: string, updates: Partial<VerificationConfig>): Promise<void> {
    await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        ...(updates.channelId !== undefined && { verifyChannelId: updates.channelId }),
        ...(updates.emoji !== undefined && { verifyEmoji: updates.emoji }),
        ...(updates.messageId !== undefined && { verifyMessageId: updates.messageId }),
        ...(updates.unverifiedRoleId !== undefined && { unverifiedRoleId: updates.unverifiedRoleId }),
        ...(updates.verifiedRoleId !== undefined && { verifiedRoleId: updates.verifiedRoleId }),
        updatedAt: new Date(),
      },
      create: {
        guildId,
        verifyChannelId: updates.channelId ?? null,
        verifyEmoji: updates.emoji ?? '✅',
        verifyMessageId: updates.messageId ?? null,
        unverifiedRoleId: updates.unverifiedRoleId ?? config.UNVERIFIED_ROLE_ID ?? null,
        verifiedRoleId: updates.verifiedRoleId ?? config.VERIFIED_ROLE_ID ?? null,
      },
    });
  }

  /**
   * Verify a member (role swap + database update + audit log)
   */
  async verifyMember(
    guild: Guild,
    member: GuildMember,
    actorId = 'system',
    source: 'discord_bot' | 'dashboard' = 'discord_bot',
  ): Promise<VerifyMemberResult> {
    const settings = await this.getConfig(guild.id);
    const unverifiedRoleId = settings.unverifiedRoleId || config.UNVERIFIED_ROLE_ID;
    const verifiedRoleId = settings.verifiedRoleId || config.VERIFIED_ROLE_ID;

    // Check if user is already verified in DB
    const existingUser = await prisma.users.findUnique({
      where: { discordId: member.id },
    });

    if (existingUser?.isVerified && verifiedRoleId && member.roles.cache.has(verifiedRoleId)) {
      logger.info(`[Verification] User ${member.user.tag} (${member.id}) is already verified. Idempotent return.`);
      return {
        alreadyVerified: true,
        success: true,
        message: 'Kamu sudah terverifikasi sebelumnya!',
      };
    }

    // Role swap
    try {
      if (unverifiedRoleId && member.roles.cache.has(unverifiedRoleId)) {
        await member.roles.remove(unverifiedRoleId);
      }

      if (verifiedRoleId) {
        await member.roles.add(verifiedRoleId);
      }
    } catch (roleError) {
      logger.error({ err: roleError }, `[Verification] Failed to modify roles for ${member.id}`);
      throw new Error('Gagal memperbarui role member. Pastikan role bot berada di atas role yang diatur.');
    }

    // Database updates in transaction
    await prisma.$transaction([
      prisma.users.upsert({
        where: { discordId: member.id },
        update: {
          isVerified: true,
          username: member.user.username,
          updatedAt: new Date(),
        },
        create: {
          discordId: member.id,
          username: member.user.username,
          isVerified: true,
          joinedAt: member.joinedAt ?? new Date(),
        },
      }),
    ]);

    // Audit logging
    await logAudit({
      actorDiscordId: actorId,
      action: 'member_verify',
      detail: {
        userId: member.id,
        userTag: member.user.tag,
        guildId: guild.id,
      },
      source,
    });

    logger.info(`[Verification] Successfully verified member ${member.user.tag} (${member.id})`);

    return {
      alreadyVerified: false,
      success: true,
      message: 'Kamu berhasil diverifikasi! Selamat datang di Cozy For Us 🤍',
    };
  }

  /**
   * Send or update the permanent verification panel embed in a channel
   */
  async sendVerificationPanel(channel: TextChannel, emoji = '✅'): Promise<Message> {
    const embed = createCozyEmbed(
      'Verifikasi untuk Masuk ke Cozy For Us 🤍',
      [
        'Halowww! Selamat datang di **Cozy For Us**.',
        '',
        `Silakan klik reaction ${emoji} di bawah ini untuk memverifikasi dirimu dan membuka akses ke seluruh channel komunitas kami!`,
        '',
        '▸ *Pastikan kamu membaca dan mematuhi peraturan server.*',
      ].join('\n'),
    );

    const message = await channel.send({ embeds: [embed] });
    await message.react(emoji);

    // Save messageId and channelId into database
    await this.updateConfig(channel.guild.id, {
      channelId: channel.id,
      messageId: message.id,
      emoji,
    });

    logger.info(`[Verification] Verification panel published to #${channel.name} (${message.id})`);
    return message;
  }
}

export const verificationService = new VerificationService();
