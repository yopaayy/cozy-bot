// src/bot/commands/verify/verify-force.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import type { Command } from '../../../shared/types';
import { verificationService } from '../../modules/verification/verification.service';
import { prisma } from '../../../shared/database';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embed-builder';
import { isAdmin } from '../../utils/permission-check';
import { logger } from '../../../shared/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Command verifikasi member')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('force')
        .setDescription('Verifikasi member secara manual (Admin only)')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('Member yang ingin diverifikasi')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sync')
        .setDescription('Sinkronisasi semua member server yang sudah punya role verified ke database'),
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    // 1. Defer immediately to prevent Discord interaction timeout
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild || !interaction.member) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Command hanya bisa digunakan di dalam server.')],
      });
      return;
    }

    const adminMember =
      (interaction.member as GuildMember) ||
      (await interaction.guild.members.fetch(interaction.user.id).catch(() => null));

    if (!adminMember || !isAdmin(adminMember)) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Akses Ditolak', 'Hanya Administrator yang dapat menggunakan command ini.')],
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    // 2. Handle Subcommand: sync
    if (subcommand === 'sync') {
      try {
        const config = await verificationService.getConfig(interaction.guild.id);
        const verifiedRoleId = config.verifiedRoleId;
        const unverifiedRoleId = config.unverifiedRoleId;

        if (!verifiedRoleId) {
          await interaction.editReply({
            embeds: [createErrorEmbed('Role Verified Belum Diatur', 'Jalankan `/verify-setup` terlebih dahulu.')],
          });
          return;
        }

        const allMembers = await interaction.guild.members.fetch();
        let verifiedSynced = 0;
        let unverifiedCleaned = 0;

        for (const [, member] of allMembers) {
          if (member.user.bot) continue;

          if (member.roles.cache.has(verifiedRoleId)) {
            verifiedSynced++;

            // Clean up unverified role if present
            if (unverifiedRoleId && member.roles.cache.has(unverifiedRoleId)) {
              await member.roles.remove(unverifiedRoleId).catch(() => null);
              unverifiedCleaned++;
            }

            // Update user in database
            await prisma.users.upsert({
              where: { discordId: member.id },
              update: {
                username: member.user.username,
                isVerified: true,
                updatedAt: new Date(),
              },
              create: {
                discordId: member.id,
                username: member.user.username,
                isVerified: true,
                joinedAt: member.joinedAt ?? new Date(),
              },
            });
          }
        }

        // Update verification panel embed stats in channel
        await verificationService.updatePanelStats(interaction.guild);

        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              'Sinkronisasi Verifikasi Selesai 🤍',
              [
                `▸ **Total Member Server**: \`${allMembers.filter((m) => !m.user.bot).size}\``,
                `▸ **Member Verified Disinkronkan**: \`${verifiedSynced}\``,
                `▸ **Role @Unverified Dibersihkan**: \`${unverifiedCleaned}\``,
                '',
                '*Embed panel verifikasi di channel verifikasi juga telah otomatis disinkronkan dengan data terbaru!*',
              ].join('\n'),
            ),
          ],
        });
      } catch (syncErr: any) {
        logger.error({ err: syncErr }, '[Command:verify sync] Error during sync:');
        await interaction.editReply({
          embeds: [createErrorEmbed('Gagal Sinkronisasi', syncErr.message || 'Terjadi kesalahan sistem.')],
        });
      }
      return;
    }

    // 3. Handle Subcommand: force
    const targetUser = interaction.options.getUser('user', true);
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Member Tidak Ditemukan', 'Member tersebut tidak ada di server ini.')],
      });
      return;
    }

    try {
      const result = await verificationService.verifyMember(
        interaction.guild,
        targetMember,
        interaction.user.id,
        'discord_bot',
      );

      if (result.alreadyVerified) {
        await interaction.editReply({
          embeds: [createSuccessEmbed('Member Sudah Terverifikasi', `<@${targetMember.id}> sudah berstatus terverifikasi.`)],
        });
      } else {
        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              'Verifikasi Manual Berhasil',
              `Member <@${targetMember.id}> (${targetMember.user.tag}) berhasil diverifikasi secara manual oleh <@${interaction.user.id}>.`,
            ),
          ],
        });
      }
    } catch (err: any) {
      logger.error('[Command:verify-force] Error executing manual verification:', err);
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Memverifikasi', err.message || 'Terjadi kesalahan sistem.')],
      });
    }
  },
};

export default command;
