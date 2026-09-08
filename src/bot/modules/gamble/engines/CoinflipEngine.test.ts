// src/bot/modules/gamble/engines/CoinflipEngine.test.ts
import { describe, it, expect } from 'vitest';
import { CoinflipEngine } from './CoinflipEngine';

describe('CoinflipEngine', () => {
  const engine = new CoinflipEngine();

  describe('parseChoice', () => {
    it('should parse heads variations correctly', () => {
      expect(engine.parseChoice('h')).toEqual({ valid: true, choice: 'heads', wasRandom: false });
      expect(engine.parseChoice('head')).toEqual({ valid: true, choice: 'heads', wasRandom: false });
      expect(engine.parseChoice('heads')).toEqual({ valid: true, choice: 'heads', wasRandom: false });
      expect(engine.parseChoice('HEADS')).toEqual({ valid: true, choice: 'heads', wasRandom: false });
    });

    it('should parse tails variations correctly', () => {
      expect(engine.parseChoice('t')).toEqual({ valid: true, choice: 'tails', wasRandom: false });
      expect(engine.parseChoice('tail')).toEqual({ valid: true, choice: 'tails', wasRandom: false });
      expect(engine.parseChoice('tails')).toEqual({ valid: true, choice: 'tails', wasRandom: false });
      expect(engine.parseChoice('TAILS')).toEqual({ valid: true, choice: 'tails', wasRandom: false });
    });

    it('should automatically pick a random choice when input is omitted or empty', () => {
      const emptyResult = engine.parseChoice();
      expect(emptyResult.valid).toBe(true);
      expect(emptyResult.wasRandom).toBe(true);
      expect(['heads', 'tails']).toContain(emptyResult.choice);

      const whitespaceResult = engine.parseChoice('   ');
      expect(whitespaceResult.valid).toBe(true);
      expect(whitespaceResult.wasRandom).toBe(true);
      expect(['heads', 'tails']).toContain(whitespaceResult.choice);
    });

    it('should reject invalid choices', () => {
      expect(engine.parseChoice('xyz')).toEqual({ valid: false, error: 'INVALID_CHOICE' });
      expect(engine.parseChoice('123')).toEqual({ valid: false, error: 'INVALID_CHOICE' });
    });
  });

  describe('validateBet', () => {
    it('should validate valid amounts and shorthands', () => {
      expect(engine.validateBet(5000, 10000n)).toEqual({ valid: true, amount: 5000n });
      expect(engine.validateBet('10k', 50000n)).toEqual({ valid: true, amount: 10000n });
      expect(engine.validateBet('all', 75000n)).toEqual({ valid: true, amount: 75000n });
    });

    it('should clamp bet to maxBet (250,000)', () => {
      expect(engine.validateBet('1m', 2000000n)).toEqual({ valid: true, amount: 250000n });
      expect(engine.validateBet('all', 500000n)).toEqual({ valid: true, amount: 250000n });
    });

    it('should reject bet too low or insufficient funds', () => {
      expect(engine.validateBet(0, 10000n).error).toBe('BET_TOO_LOW');
      expect(engine.validateBet(5000, 2000n).error).toBe('INSUFFICIENT_FUNDS');
      expect(engine.validateBet('all', 0n).error).toBe('INSUFFICIENT_FUNDS');
      expect(engine.validateBet('abc', 10000n).error).toBe('INVALID_FORMAT');
    });
  });

  describe('flip and evaluate', () => {
    it('should flip either heads or tails', () => {
      const flips = new Set<string>();
      for (let i = 0; i < 50; i++) {
        flips.add(engine.flip());
      }
      expect(flips.has('heads') || flips.has('tails')).toBe(true);
    });

    it('should calculate 2x payout on win', () => {
      const res = engine.evaluate('heads', 'heads', 5000n);
      expect(res.won).toBe(true);
      expect(res.payout).toBe(10000n);
      expect(res.netProfit).toBe(5000n);
    });

    it('should return 0 payout on loss', () => {
      const res = engine.evaluate('heads', 'tails', 5000n);
      expect(res.won).toBe(false);
      expect(res.payout).toBe(0n);
      expect(res.netProfit).toBe(-5000n);
    });
  });
});
