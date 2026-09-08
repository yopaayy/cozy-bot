// src/bot/events/voiceStateUpdate.ts
import { Events, VoiceState } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';

export const event: Event<Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  execute: async (client, oldState: VoiceState, newState: VoiceState) => {
    // Leveling Voice XP tracking will attach here in Fase 4
  },
};

export default event;
