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
};
