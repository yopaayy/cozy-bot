// src/bot/modules/gamble/gamble.assets.ts
import type { Guild } from 'discord.js';
import type { SlotSymbolKey } from './gamble.types';

export const FALLBACK_EMOJIS = {
  COZY_CASH: '🪙',
  SLOT_SPIN: '🎰',
  SLOTS_ITEM_1: '☕',
  SLOTS_ITEM_2: '🤍',
  SLOTS_ITEM_3: '⭐',
  SLOTS_ITEM_4: '🅲',
  SLOTS_ITEM_5: '🆉',
  CASH_FLYING: '💸',
  FIRE_STREAK: '🔥',
  MINES_TILE: '❓',
  MINES_DIAMOND: '💎',
  MINES_EXPLODED: '💥',
  MINES_BOMB: '💣',
  MINES_PICKAXE: '⛏️',
  COIN_SPIN: '🪙',
  COIN_HEADS: '🗣️',
  COIN_TAILS: '🦅',
    BJ_CHIP: '🪙',
  BJ_DEAL: '🎴',
  BJ_SHUFFLE: '🃏',
  BJ_WIN: '🏆',
  BJ_BUST: '💥',
  BJ_LOSE: '❌',
  BJ_PUSH: '⚖️',
  BJ_BLACKJACK: '👑',
  BJ_DOUBLE: '⚡',
  BJ_JACKPOT_GIF: '🎰',
  BJ_VS_GIF: '⚔️',
  BJ_CARD_BACK: '🎴',
} as const;

/**
 * Cache or find custom emoji by name from guild
 */
function findGuildEmoji(guild: Guild | null | undefined, name: string): string | null {
  if (!guild || !guild.emojis) return null;
  const emoji = guild.emojis.cache.find((e) => e.name?.toLowerCase() === name.toLowerCase());
  return emoji ? emoji.toString() : null;
}

export const GambleAssets = {
  /**
   * Currency Emoji (:cozycash: or fallback 🪙)
   */
  getCurrency(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cozycash') || FALLBACK_EMOJIS.COZY_CASH;
  },

  /**
   * Spinning reel animated emoji (:slot_spin: or fallback 🎰)
   */
  getSlotSpin(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'slot_spin') || FALLBACK_EMOJIS.SLOT_SPIN;
  },

  /**
   * Slot symbol emoji (slotsitem1..slotsitem5)
   */
  getSlotSymbol(symbol: SlotSymbolKey, guild?: Guild | null): string {
    const custom = findGuildEmoji(guild, symbol);
    if (custom) return custom;

    switch (symbol) {
      case 'slotsitem1':
        return FALLBACK_EMOJIS.SLOTS_ITEM_1;
      case 'slotsitem2':
        return FALLBACK_EMOJIS.SLOTS_ITEM_2;
      case 'slotsitem3':
        return FALLBACK_EMOJIS.SLOTS_ITEM_3;
      case 'slotsitem4':
        return FALLBACK_EMOJIS.SLOTS_ITEM_4;
      case 'slotsitem5':
        return FALLBACK_EMOJIS.SLOTS_ITEM_5;
      default:
        return '❓';
    }
  },

  /**
   * Flying cash GIF for daily/weekly (:cash_flying: or fallback 💸)
   */
  getCashFlying(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cash_flying') || FALLBACK_EMOJIS.CASH_FLYING;
  },

  /**
   * Fire streak animated GIF for daily (:fire_streak: or fallback 🔥)
   */
  getFireStreak(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'fire_streak') || FALLBACK_EMOJIS.FIRE_STREAK;
  },

  /**
   * Mines game emojis
   */
  getMinesTile(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'mines_tile') || FALLBACK_EMOJIS.MINES_TILE;
  },
  getMinesDiamond(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'mines_diamond') || FALLBACK_EMOJIS.MINES_DIAMOND;
  },
  getMinesExploded(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'mines_exploded') || FALLBACK_EMOJIS.MINES_EXPLODED;
  },
  getMinesBomb(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'mines_bomb') || FALLBACK_EMOJIS.MINES_BOMB;
  },
  getMinesPickaxe(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'mines_pickaxe') || FALLBACK_EMOJIS.MINES_PICKAXE;
  },

  /**
   * Coinflip emojis
   */
  getCoinSpin(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cozy_coinspin') || FALLBACK_EMOJIS.COIN_SPIN;
  },
  getCoinHeads(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'coin_heads') || FALLBACK_EMOJIS.COIN_HEADS;
  },
  getCoinTails(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'coin_tails') || FALLBACK_EMOJIS.COIN_TAILS;
  },

  /**
   * Cozy Cat Walk emojis (uploaded custom emojis with Unicode fallbacks)
   */
  getCatWalk(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_walk') || '🐱';
  },
  getCatTile(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_tile') || '🟩';
  },
  getCatPaw(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_paw') || '🐾';
  },
  getCatFish(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_fish') || '🐟';
  },
  getCatYarn(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_yarn') || '🧶';
  },
  getCatObstacle(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_obstacle') || '🥒';
  },
  getCatPoof(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_poof') || '💥';
  },
  getCatTileFail(guild?: Guild | null): string {
    return findGuildEmoji(guild, 'cat_tile_fail') || '🟥';
  },
  getCatTrailItem(stepIndex: number, guild?: Guild | null): string {
    const items = [
      this.getCatPaw(guild),
      this.getCatFish(guild),
      this.getCatYarn(guild),
    ];
    return items[stepIndex % items.length];
  },


  // ==========================================
  //  BLACKJACK 21 ASSET RESOLVERS & STATIC MAP
  // ==========================================

  /**
   * Direct Application Emoji map for the 66 uploaded Kenney playing cards & casino badges
   */
  APPLICATION_EMOJIS: {
    // --- Status Badges & Chips ---
    card_chip: '<:card_chip:1548338033068212344>',
    card_chip_black: '<:card_chip_black:1548338035639324734>',
    card_deal: '<:card_deal:1548338066534568047>',
    card_back: '<:card_back:1548338031105409154>',
    bj_win: '<:bj_win:1548338028131651675>',
    bj_blackjack: '<:bj_blackjack:1548338018409127937>',
    bj_bust: '<:bj_bust:1548338020166533130>',
    bj_lose: '<:bj_lose:1548338023987683488>',
    bj_push: '<:bj_push:1548338026294419607>',
    bj_double: '<:bj_double:1548338022062497832>',

    // --- Animated GIFs ---
    card_shuffle: '<a:card_shuffle:1548355359725457508>',
    card_flip: '<a:card_flip:1548354553928486963>',
    bj_jackpot: '<a:bj_jackpot:1548355353748439121>',
    pvp_vs: '<a:pvp_vs:1548354556784672880>',

    // --- Spades (13 cards) ---
    card_spades_a: '<:card_spades_a:1548338007487025243>',
    card_spades_2: '<:card_spades_2:1548337986423230605>',
    card_spades_3: '<:card_spades_3:1548337988424048750>',
    card_spades_4: '<:card_spades_4:1548337990487638107>',
    card_spades_5: '<:card_spades_5:1548337992362365009>',
    card_spades_6: '<:card_spades_6:1548337994786676786>',
    card_spades_7: '<:card_spades_7:1548337997441794068>',
    card_spades_8: '<:card_spades_8:1548337999610122401>',
    card_spades_9: '<:card_spades_9:1548338002403663942>',
    card_spades_10: '<:card_spades_10:1548338005293535333>',
    card_spades_j: '<:card_spades_j:1548338010775363754>',
    card_spades_q: '<:card_spades_q:1548338016446058496>',
    card_spades_k: '<:card_spades_k:1548338012990218260>',

    // --- Hearts (13 cards) ---
    card_hearts_a: '<:card_hearts_a:1548337977170862200>',
    card_hearts_2: '<:card_hearts_2:1548337957147123773>',
    card_hearts_3: '<:card_hearts_3:1548337959256850613>',
    card_hearts_4: '<:card_hearts_4:1548337961324650506>',
    card_hearts_5: '<:card_hearts_5:1548337963312873513>',
    card_hearts_6: '<:card_hearts_6:1548337965309366332>',
    card_hearts_7: '<:card_hearts_7:1548337967263645766>',
    card_hearts_8: '<:card_hearts_8:1548337969222652015>',
    card_hearts_9: '<:card_hearts_9:1548337972137693256>',
    card_hearts_10: '<:card_hearts_10:1548337974708797471>',
    card_hearts_j: '<:card_hearts_j:1548337979536183366>',
    card_hearts_q: '<:card_hearts_q:1548337984460562442>',
    card_hearts_k: '<:card_hearts_k:1548337982467997788>',

    // --- Clubs (13 cards) ---
    card_clubs_a: '<:card_clubs_a:1548338056606654566>',
    card_clubs_2: '<:card_clubs_2:1548338037568573530>',
    card_clubs_3: '<:card_clubs_3:1548338039581839520>',
    card_clubs_4: '<:card_clubs_4:1548338041750552616>',
    card_clubs_5: '<:card_clubs_5:1548338043750981732>',
    card_clubs_6: '<:card_clubs_6:1548338045806444634>',
    card_clubs_7: '<:card_clubs_7:1548338047752474624>',
    card_clubs_8: '<:card_clubs_8:1548338049916739594>',
    card_clubs_9: '<:card_clubs_9:1548338051749646426>',
    card_clubs_10: '<:card_clubs_10:1548338053578362950>',
    card_clubs_j: '<:card_clubs_j:1548338059055997009>',
    card_clubs_q: '<:card_clubs_q:1548338064072515705>',
    card_clubs_k: '<:card_clubs_k:1548338060926652506>',

    // --- Diamonds (13 cards) ---
    card_diamonds_a: '<:card_diamonds_a:1548338087925649428>',
    card_diamonds_2: '<:card_diamonds_2:1548338068510216203>',
    card_diamonds_3: '<:card_diamonds_3:1548338070825205810>',
    card_diamonds_4: '<:card_diamonds_4:1548338073161695393>',
    card_diamonds_5: '<:card_diamonds_5:1548338075221106780>',
    card_diamonds_6: '<:card_diamonds_6:1548338077284433940>',
    card_diamonds_7: '<:card_diamonds_7:1548338079386050691>',
    card_diamonds_8: '<:card_diamonds_8:1548338081558560998>',
    card_diamonds_9: '<:card_diamonds_9:1548338083085287526>',
    card_diamonds_10: '<:card_diamonds_10:1548338085811593416>',
    card_diamonds_j: '<:card_diamonds_j:1548337950331506859>',
    card_diamonds_q: '<:card_diamonds_q:1548337955091910748>',
    card_diamonds_k: '<:card_diamonds_k:1548337952764207324>',
  } as Record<string, string>,

  /**
   * Resolve a card display emoji.
   * Priority: Static Application Emoji Map > Application Emoji Cache > Guild Emoji > Unicode fallback
   */
  getCardDisplay(cardId: number, hidden: boolean, client?: any, guild?: Guild | null): string {
    if (hidden || cardId <= 0 || cardId > 52) {
      return this.getBlackjackEmoji('card_back', guild, client);
    }

    const suits = ['spades', 'clubs', 'hearts', 'diamonds'];
    const rankNames = ['k', 'a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q'];
    const suitSymbols = ['\u2660', '\u2663', '\u2665', '\u2666'];
    const rankLabels = ['K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'];

    const suitIndex = Math.floor((cardId - 1) / 13);
    const rankIndex = cardId % 13;
    const cardName = `card_${suits[suitIndex]}_${rankNames[rankIndex]}`;
    const unicodeLabel = `[${rankLabels[rankIndex]}${suitSymbols[suitIndex]}]`;

    // 1. Direct Instant Resolution via Static Map
    if (this.APPLICATION_EMOJIS[cardName]) {
      return this.APPLICATION_EMOJIS[cardName];
    }

    // 2. Try Application Emojis from client cache
    if (client?.application?.emojis?.cache) {
      const appEmoji = client.application.emojis.cache.find((e: any) => e.name === cardName);
      if (appEmoji) return appEmoji.toString();
    }

    // 3. Try Guild emojis
    const guildEmoji = findGuildEmoji(guild, cardName);
    if (guildEmoji) return guildEmoji;

    // 4. Unicode fallback
    return unicodeLabel;
  },

  /**
   * Resolve Blackjack status/action emoji by key.
   * Keys: 'card_chip', 'card_chip_black', 'card_deal', 'card_back', 'bj_win', 'bj_bust', 'bj_lose', 'bj_push', 'bj_blackjack', 'bj_double',
   *       'card_shuffle' (GIF), 'bj_jackpot' (GIF), 'pvp_vs' (GIF), 'card_flip' (GIF)
   */
  getBlackjackEmoji(key: string, guild?: Guild | null, client?: any): string {
    // 1. Direct Instant Resolution via Static Map
    if (this.APPLICATION_EMOJIS[key]) {
      return this.APPLICATION_EMOJIS[key];
    }

    // 2. Try Application Emojis cache
    if (client?.application?.emojis?.cache) {
      const appEmoji = client.application.emojis.cache.find((e: any) => e.name === key);
      if (appEmoji) return appEmoji.toString();
    }

    // 3. Try Guild emojis
    const guildEmoji = findGuildEmoji(guild, key);
    if (guildEmoji) return guildEmoji;

    // 4. Unicode fallback map
    const fallbackMap: Record<string, string> = {
      card_chip: FALLBACK_EMOJIS.BJ_CHIP,
      card_chip_black: '🪙',
      card_deal: FALLBACK_EMOJIS.BJ_DEAL,
      card_back: FALLBACK_EMOJIS.BJ_CARD_BACK,
      card_shuffle: FALLBACK_EMOJIS.BJ_SHUFFLE,
      card_flip: FALLBACK_EMOJIS.BJ_DEAL,
      bj_win: FALLBACK_EMOJIS.BJ_WIN,
      bj_bust: FALLBACK_EMOJIS.BJ_BUST,
      bj_lose: FALLBACK_EMOJIS.BJ_LOSE,
      bj_push: FALLBACK_EMOJIS.BJ_PUSH,
      bj_blackjack: FALLBACK_EMOJIS.BJ_BLACKJACK,
      bj_double: FALLBACK_EMOJIS.BJ_DOUBLE,
      bj_jackpot: FALLBACK_EMOJIS.BJ_JACKPOT_GIF,
      pvp_vs: FALLBACK_EMOJIS.BJ_VS_GIF,
    };

    return fallbackMap[key] || '🎴';
  },
};
