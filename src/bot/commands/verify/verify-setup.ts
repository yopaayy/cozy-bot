// src/bot/commands/verify/verify-setup.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
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
    .setName('verify-setup')
    .setDescription('Setup sistem verifikasi member (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel tempat panel verifikasi diletakkan')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setName('unverified_role')
        .setDescription('Role untuk member yang belum verifikasi')
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setName('verified_role')
        .setDescription('Role yang diberikan setelah verifikasi berhasil')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('emoji')
        .setDescription('Emoji untuk reaction verifikasi (default: ✅)')
        .setRequired(false),
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

    if (!member || !isAdmin(member)) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Akses Ditolak', 'Hanya Administrator yang dapat menggunakan perintah ini.')],
      });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    const unverifiedRole = interaction.options.getRole('unverified_role', true);
    const verifiedRole = interaction.options.getRole('verified_role', true);
    const rawEmoji = (interaction.options.getString('emoji') || '✅').trim();

    const { parseEmoji } = await import('discord.js');
    const parsed = parseEmoji(rawEmoji);
    let emoji = rawEmoji;
    if (parsed?.id) {
      emoji = parsed.animated
        ? `<a:${parsed.name}:${parsed.id}>`
        : `<:${parsed.name}:${parsed.id}>`;
    }

    try {
      await verificationService.updateConfig(interaction.guild.id, {
        channelId: channel.id,
        unverifiedRoleId: unverifiedRole.id,
        verifiedRoleId: verifiedRole.id,
        emoji,
      });

      const successEmbed = createSuccessEmbed(
        'Setup Verifikasi Berhasil',
        [
          `▸ **Channel**: <#${channel.id}>`,
          `▸ **Unverified Role**: <@&${unverifiedRole.id}>`,
          `▸ **Verified Role**: <@&${verifiedRole.id}>`,
          `▸ **Emoji**: ${emoji}`,
          '',
          '*Langkah selanjutnya: jalankan `/verify-panel` untuk mempublikasikan embed panel verifikasi ke channel tersebut.*',
        ].join('\n'),
      );

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (err) {
      logger.error({ err }, '[Command:verify-setup] Failed to save config:');
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Menyimpan Setup', 'Terjadi kesalahan saat menyimpan pengaturan verifikasi.')],
      });
    }
  },
};

export default command;
