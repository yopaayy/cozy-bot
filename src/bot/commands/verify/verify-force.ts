// src/bot/commands/verify/verify-force.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import type { Command } from '../../../shared/types';
import { verificationService } from '../../modules/verification/verification.service';
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
        embeds: [createErrorEmbed('Akses Ditolak', 'Hanya Administrator yang dapat memverifikasi manual.')],
      });
      return;
    }

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
