// src/bot/commands/verify/verify-setup.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ChatInputCommandInteraction,
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
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({
        embeds: [createErrorEmbed('Command hanya bisa digunakan di dalam server.')],
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!isAdmin(member)) {
      await interaction.reply({
        embeds: [createErrorEmbed('Akses Ditolak', 'Hanya Administrator yang dapat menggunakan perintah ini.')],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel', true);
    const unverifiedRole = interaction.options.getRole('unverified_role', true);
    const verifiedRole = interaction.options.getRole('verified_role', true);
    const emoji = interaction.options.getString('emoji') || '✅';

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
