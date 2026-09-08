// src/bot/commands/verify/verify-panel.ts
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../../../shared/types';
import { verificationService } from '../../modules/verification/verification.service';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embed-builder';
import { isAdmin } from '../../utils/permission-check';
import { logger } from '../../../shared/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('Kirim panel embed verifikasi permanen ke channel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel tujuan (opsional, default: channel dari verify-setup)')
        .addChannelTypes(ChannelType.GuildText)
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

    try {
      const config = await verificationService.getConfig(interaction.guild.id);
      const targetChannel =
        (interaction.options.getChannel('channel') as TextChannel) ||
        (config.channelId ? (interaction.guild.channels.cache.get(config.channelId) as TextChannel) : null) ||
        (interaction.channel as TextChannel);

      if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Channel Tidak Valid', 'Channel tujuan tidak ditemukan atau bukan channel teks.')],
        });
        return;
      }

      const panelMessage = await verificationService.sendVerificationPanel(
        targetChannel,
        config.emoji || '✅',
      );

      await interaction.editReply({
        embeds: [
          createSuccessEmbed(
            'Panel Verifikasi Berhasil Dikirim',
            `Panel telah dikirim ke <#${targetChannel.id}> dengan ID pesan \`${panelMessage.id}\`.`,
          ),
        ],
      });
    } catch (err) {
      logger.error({ err }, '[Command:verify-panel] Error sending verification panel:');
      await interaction.editReply({
        embeds: [createErrorEmbed('Gagal Mengirim Panel', 'Terjadi kesalahan saat mengirim panel verifikasi.')],
      });
    }
  },
};

export default command;
