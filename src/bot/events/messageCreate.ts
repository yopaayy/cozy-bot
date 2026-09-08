import { Events, Message } from 'discord.js';
import type { Event } from '../../shared/types';
import { logger } from '../../shared/logger';
import { handleGambleTextMessage } from '../modules/gamble/gamble.text-handler';

export const event: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  execute: async (client, message: Message) => {
    // Ignore bots or system messages
    if (message.author.bot || !message.guild) return;

    try {
      // Gamble & Economy Text Commands (creg, ccash, cozyslot, cslot, cdep, cwith, cdaily, cweekly, cwork, ctop, etc.)
      const handled = await handleGambleTextMessage(client, message);
      if (handled) return;
    } catch (err: any) {
      logger.error({ err }, 'Error in gamble text command handler:');
      if (err?.code === 'P1001' || err?.message?.includes("Can't reach database")) {
        await message.reply({ content: '⚠️ Gagal terhubung ke database server di hosting. Sedang mencoba ulang, silakan coba 1-2 detik lagi!' }).catch(() => null);
      } else {
        await message.reply({ content: '❌ Terjadi kesalahan saat memproses perintah.' }).catch(() => null);
      }
    }

    // Text Leveling XP tracking will attach here in Fase 4
  },
};

export default event;
