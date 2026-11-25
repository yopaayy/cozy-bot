// src/shared/types.ts
import {
  ChatInputCommandInteraction,
  ClientEvents,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type { CozyClient } from '../bot/client';

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export interface Command {
  data: SlashCommandData;
  category?: string;
  execute: (interaction: ChatInputCommandInteraction, client: CozyClient) => Promise<void>;
}

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: CozyClient, ...args: ClientEvents[K]) => Promise<void>;
}

export interface ButtonHandler {
  customId: string | RegExp;
  execute: (interaction: ButtonInteraction, client: CozyClient) => Promise<void>;
}

export interface SelectMenuHandler {
  customId: string | RegExp;
  execute: (interaction: StringSelectMenuInteraction, client: CozyClient) => Promise<void>;
}

export interface ModalHandler {
  customId: string | RegExp;
  execute: (interaction: ModalSubmitInteraction, client: CozyClient) => Promise<void>;
}
