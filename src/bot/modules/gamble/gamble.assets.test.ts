// src/bot/modules/gamble/gamble.assets.test.ts
import { describe, it, expect } from 'vitest';
import { GambleAssets, FALLBACK_EMOJIS } from './gamble.assets';

describe('GambleAssets', () => {
  it('should return fallback currency emoji when no guild or custom emojis', () => {
    expect(GambleAssets.getCurrency(null)).toBe(FALLBACK_EMOJIS.COZY_CASH);
    expect(GambleAssets.getCurrency(undefined)).toBe('🪙');
  });

  it('should return fallback slot spin emoji when no guild or custom emojis', () => {
    expect(GambleAssets.getSlotSpin(null)).toBe(FALLBACK_EMOJIS.SLOT_SPIN);
    expect(GambleAssets.getSlotSpin(undefined)).toBe('🎰');
  });

  it('should resolve fallback symbol emojis', () => {
    expect(GambleAssets.getSlotSymbol('slotsitem1', null)).toBe('☕');
    expect(GambleAssets.getSlotSymbol('slotsitem2', null)).toBe('🤍');
    expect(GambleAssets.getSlotSymbol('slotsitem3', null)).toBe('⭐');
    expect(GambleAssets.getSlotSymbol('slotsitem4', null)).toBe('🅲');
    expect(GambleAssets.getSlotSymbol('slotsitem5', null)).toBe('🆉');
  });

  it('should resolve flying cash and fire streak fallbacks', () => {
    expect(GambleAssets.getCashFlying(null)).toBe('💸');
    expect(GambleAssets.getFireStreak(null)).toBe('🔥');
  });

  it('should resolve mines emojis fallbacks', () => {
    expect(GambleAssets.getMinesTile(null)).toBe('❓');
    expect(GambleAssets.getMinesDiamond(null)).toBe('💎');
    expect(GambleAssets.getMinesExploded(null)).toBe('💥');
    expect(GambleAssets.getMinesBomb(null)).toBe('💣');
    expect(GambleAssets.getMinesPickaxe(null)).toBe('⛏️');
  });
});
