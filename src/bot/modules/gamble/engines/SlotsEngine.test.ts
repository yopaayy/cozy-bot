// src/bot/modules/gamble/engines/SlotsEngine.test.ts
import { describe, it, expect } from 'vitest';
import { SlotsEngine } from './SlotsEngine';

describe('SlotsEngine', () => {
  const engine = new SlotsEngine({ minBet: 1, maxBet: 250000 });

  describe('validateBet', () => {
    it('should allow valid bet within balance', () => {
      const res = engine.validateBet(100, 1000n);
      expect(res.valid).toBe(true);
      expect(res.amount).toBe(100n);
    });

    it('should allow "all" to bet entire balance', () => {
      const res = engine.validateBet('all', 5500n);
      expect(res.valid).toBe(true);
      expect(res.amount).toBe(5500n);
    });

    it('should allow shorthand bet suffixes (10k, 100k, 1m)', () => {
      const res10k = engine.validateBet('10k', 50000n);
      expect(res10k.valid).toBe(true);
      expect(res10k.amount).toBe(10000n);

      const res100k = engine.validateBet('100k', 200000n);
      expect(res100k.valid).toBe(true);
      expect(res100k.amount).toBe(100000n);

      const res1m = engine.validateBet('1m', 2000000n);
      expect(res1m.valid).toBe(true);
      // Clamped to maxBet 250,000
      expect(res1m.amount).toBe(250000n);
    });

    it('should reject bet exceeding balance', () => {
      const res = engine.validateBet(2000, 1000n);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('INSUFFICIENT_FUNDS');
    });

    it('should reject non-numeric string', () => {
      const res = engine.validateBet('abc', 1000n);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('INVALID_BET_FORMAT');
    });

    it('should reject zero or negative bets', () => {
      const resZero = engine.validateBet(0, 1000n);
      expect(resZero.valid).toBe(false);

      const resNeg = engine.validateBet(-50, 1000n);
      expect(resNeg.valid).toBe(false);
    });

    it('should clamp bet to maxBet if exceeded', () => {
      const res = engine.validateBet(500000, 1000000n);
      expect(res.valid).toBe(true);
      expect(res.amount).toBe(250000n);
    });
  });

  describe('spin simulation & mechanics', () => {
    it('should return valid outcome structure', () => {
      const result = engine.spin(100, 1000n);
      expect(result.success).toBe(true);
      expect(result.bet).toBe(100n);
      expect(result.reels).toHaveLength(3);
      expect(['1x', '2x', '5x', '10x_jackpot', 'loss']).toContain(result.winTier);

      if (result.won) {
        expect(result.multiplier).toBeGreaterThan(0);
        expect(result.payout).toBe(100n * BigInt(result.multiplier));
        expect(result.newBalance).toBe(1000n + result.netProfit);
      } else {
        expect(result.multiplier).toBe(0);
        expect(result.payout).toBe(0n);
        expect(result.netProfit).toBe(-100n);
        expect(result.newBalance).toBe(900n);
      }
    });

    it('should match 95.0% expected RTP within confidence interval over 10,000 spins', () => {
      const spins = 10000;
      const bet = 100n;
      let totalWagered = 0n;
      let totalPayout = 0n;

      for (let i = 0; i < spins; i++) {
        const res = engine.spin(bet, 1000000000n);
        totalWagered += res.bet;
        totalPayout += res.payout;
      }

      const rtp = (Number(totalPayout) / Number(totalWagered)) * 100;
      // Theoretical RTP = 95.0%, sample over 10k spins should be roughly 90% - 100%
      expect(rtp).toBeGreaterThan(88);
      expect(rtp).toBeLessThan(102);
    });
  });
});
