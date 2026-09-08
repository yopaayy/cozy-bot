// src/bot/client.ts
import { Client, Collection, GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import type {
  Command,
  ButtonHandler,
  SelectMenuHandler,
  ModalHandler,
} from '../shared/types';
import { logger } from '../shared/logger';

export class CozyClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public buttons: Collection<string | RegExp, ButtonHandler> = new Collection();
  public selectMenus: Collection<string | RegExp, SelectMenuHandler> = new Collection();
  public modals: Collection<string | RegExp, ModalHandler> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.Channel,
        Partials.User,
      ],
      presence: {
        status: 'online',
        activities: [
          {
            name: 'Cozy For Us 🤍',
            type: ActivityType.Custom,
            state: 'Vibing at Cozy For Us 🤍',
          },
        ],
      },
    });

    this.on('error', (err) => {
      logger.error({ err }, 'Discord client error');
    });

    this.on('warn', (msg) => {
      logger.warn(`Discord client warning: ${msg}`);
    });
  }
}
