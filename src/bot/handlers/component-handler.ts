// src/bot/handlers/component-handler.ts
import type {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type { CozyClient } from '../client';
import { logger } from '../../shared/logger';

export async function handleButton(
  interaction: ButtonInteraction,
  client: CozyClient,
): Promise<void> {
  const { customId } = interaction;

  for (const [key, handler] of client.buttons) {
    let matches = false;
    if (typeof key === 'string') {
      matches = key === customId || customId.startsWith(`${key}:`);
    } else if (key instanceof RegExp) {
      matches = key.test(customId);
    }

    if (matches) {
      try {
        await handler.execute(interaction, client);
      } catch (err) {
        logger.error({ err }, `Error executing button handler for ${customId}`);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Terjadi kesalahan saat memproses interaksi tombol.',
            ephemeral: true,
          });
        }
      }
      return;
    }
  }

  logger.warn(`No handler found for button: ${customId}`);
}

export async function handleSelectMenu(
  interaction: StringSelectMenuInteraction,
  client: CozyClient,
): Promise<void> {
  const { customId } = interaction;

  for (const [key, handler] of client.selectMenus) {
    let matches = false;
    if (typeof key === 'string') {
      matches = key === customId || customId.startsWith(`${key}:`);
    } else if (key instanceof RegExp) {
      matches = key.test(customId);
    }

    if (matches) {
      try {
        await handler.execute(interaction, client);
      } catch (err) {
        logger.error({ err }, `Error executing select menu handler for ${customId}`);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Terjadi kesalahan saat memproses pilihan menu.',
            ephemeral: true,
          });
        }
      }
      return;
    }
  }

  logger.warn(`No handler found for select menu: ${customId}`);
}

export async function handleModal(
  interaction: ModalSubmitInteraction,
  client: CozyClient,
): Promise<void> {
  const { customId } = interaction;

  for (const [key, handler] of client.modals) {
    let matches = false;
    if (typeof key === 'string') {
      matches = key === customId || customId.startsWith(`${key}:`);
    } else if (key instanceof RegExp) {
      matches = key.test(customId);
    }

    if (matches) {
      try {
        await handler.execute(interaction, client);
      } catch (err) {
        logger.error({ err }, `Error executing modal handler for ${customId}`);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Terjadi kesalahan saat memproses submit modal.',
            ephemeral: true,
          });
        }
      }
      return;
    }
  }

  logger.warn(`No handler found for modal: ${customId}`);
}
