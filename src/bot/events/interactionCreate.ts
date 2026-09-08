// src/bot/events/interactionCreate.ts
import { Events, Interaction } from 'discord.js';
import type { Event } from '../../shared/types';
import { handleButton, handleSelectMenu, handleModal } from '../handlers/component-handler';
import { logger } from '../../shared/logger';

export const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (client, interaction: Interaction) => {
    // 1. Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        logger.error({ err }, `Error executing slash command ${interaction.commandName}`);
        const replyPayload = {
          content: 'Terjadi kesalahan saat mengeksekusi command ini!',
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload);
        } else {
          await interaction.reply(replyPayload);
        }
      }
      return;
    }

    // 2. Buttons
    if (interaction.isButton()) {
      await handleButton(interaction, client);
      return;
    }

    // 3. Select Menus
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
      return;
    }

    // 4. Modals
    if (interaction.isModalSubmit()) {
      await handleModal(interaction, client);
      return;
    }
  },
};

export default event;
