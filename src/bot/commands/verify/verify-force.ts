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
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({
        embeds: [createErrorEmbed('Command hanya bisa digunakan di dalam server.')],
        ephemeral: true,
      });
      return;
    }

    const adminMember = await interaction.guild.members.fetch(interaction.user.id);
    if (!isAdmin(adminMember)) {
      await interaction.reply({
        embeds: [createErrorEmbed('Akses Ditolak', 'Hanya Administrator yang dapat memverifikasi manual.')],
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({
        embeds: [createErrorEmbed('Member Tidak Ditemukan', 'Member tersebut tidak ada di server ini.')],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

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
