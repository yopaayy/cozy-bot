// src/bot/utils/pagination.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

export interface PaginationOptions {
  customIdPrefix: string;
  currentPage: number;
  totalPages: number;
}

export function createPaginationRow(options: PaginationOptions): ActionRowBuilder<ButtonBuilder> {
  const { customIdPrefix, currentPage, totalPages } = options;

  const prevBtn = new ButtonBuilder()
    .setCustomId(`${customIdPrefix}:prev:${currentPage}`)
    .setLabel('◀ Prev')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage <= 1);

  const pageIndicator = new ButtonBuilder()
    .setCustomId(`${customIdPrefix}:indicator`)
    .setLabel(`${currentPage} / ${totalPages}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`${customIdPrefix}:next:${currentPage}`)
    .setLabel('Next ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(currentPage >= totalPages);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(prevBtn, pageIndicator, nextBtn);
}
