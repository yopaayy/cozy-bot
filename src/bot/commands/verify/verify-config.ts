// src/bot/commands/verify/verify-config.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import type { Command } from '../../../shared/types';
import { verificationService } from '../../modules/verification/verification.service';
import { createCozyEmbed, createErrorEmbed } from '../../utils/embed-builder';
import { isStaff } from '../../utils/permission-check';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('verify-config')
    .setDescription('Lihat konfigurasi verifikasi saat ini (Staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand.setName('view').setDescription('Tampilkan detail konfigurasi verifikasi'),
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

    const member =
      (interaction.member as GuildMember) ||
      (await interaction.guild.members.fetch(interaction.user.id).catch(() => null));

    if (!member || !isStaff(member)) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Akses Ditolak', 'Hanya Staff/Admin yang dapat melihat konfigurasi.')],
      });
      return;
    }

    const config = await verificationService.getConfig(interaction.guild.id);

    const embed = createCozyEmbed(
      'Konfigurasi Verifikasi Member',
      [
        `▸ **Channel**: ${config.channelId ? `<#${config.channelId}>` : '*Belum diatur*'}`,
        `▸ **Unverified Role**: ${config.unverifiedRoleId ? `<@&${config.unverifiedRoleId}>` : '*Belum diatur*'}`,
        `▸ **Verified Role**: ${config.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : '*Belum diatur*'}`,
        `▸ **Emoji**: ${config.emoji || '✅'}`,
        `▸ **Panel Message ID**: ${config.messageId ? `\`${config.messageId}\`` : '*Belum dikirim*'}`,
      ].join('\n'),
    );

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
