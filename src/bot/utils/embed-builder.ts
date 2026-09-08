// src/bot/utils/embed-builder.ts
import { EmbedBuilder } from 'discord.js';
import { COLORS, BOT_DEFAULTS } from '../../shared/constants';

export function createCozyEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(title)
    .setFooter({ text: BOT_DEFAULTS.FOOTER_TEXT })
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

export function createSuccessEmbed(title: string, description?: string): EmbedBuilder {
  return createCozyEmbed(title, description).setColor(COLORS.SUCCESS);
}

export function createErrorEmbed(title: string, description?: string): EmbedBuilder {
  return createCozyEmbed(title, description).setColor(COLORS.ERROR);
}

export function createWarningEmbed(title: string, description?: string): EmbedBuilder {
  return createCozyEmbed(title, description).setColor(COLORS.WARNING);
}
