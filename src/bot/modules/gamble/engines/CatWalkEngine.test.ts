import { describe, it, expect } from 'vitest';
import { CatWalkEngine, CAT_WALK_MULTIPLIERS } from './CatWalkEngine';

describe('CatWalkEngine', () => {
  const engine = new CatWalkEngine();

  it('should have 10 total steps with 20% failure rate', () => {
    expect(engine.totalSteps).toBe(10);
    expect(engine.failureRate).toBe(0.2);
    expect(engine.successRate).toBe(0.8);
  });

  it('should return exact calibrated multipliers matching OwO Snail Garden reference', () => {
    expect(engine.calculateMultiplier(0)).toBe(0);
    expect(engine.calculateMultiplier(1)).toBe(1.17);
    expect(engine.calculateMultiplier(2)).toBe(1.47);
    expect(engine.calculateMultiplier(3)).toBe(1.84);
    expect(engine.calculateMultiplier(4)).toBe(2.29);
    expect(engine.calculateMultiplier(5)).toBe(2.87);
    expect(engine.calculateMultiplier(6)).toBe(3.59);
    expect(engine.calculateMultiplier(7)).toBe(4.48);
    expect(engine.calculateMultiplier(8)).toBe(5.60);
    expect(engine.calculateMultiplier(9)).toBe(7.00);
    expect(engine.calculateMultiplier(10)).toBe(8.75);
  });

  it('should calculate payout accurately with BigInt scaling', () => {
    // Bet 10 at Step 1 (1.17x) -> 11
    expect(engine.calculatePayout(10n, 1.17)).toBe(11n);
    // Bet 10 at Step 2 (1.47x) -> 14
    expect(engine.calculatePayout(10n, 1.47)).toBe(14n);
    // Bet 10 at Step 3 (1.84x) -> 18
    expect(engine.calculatePayout(10n, 1.84)).toBe(18n);
    // Bet 10 at Step 4 (2.29x) -> 22
    expect(engine.calculatePayout(10n, 2.29)).toBe(22n);
    // Bet 5000 at Step 1 (1.17x) -> 5850
    expect(engine.calculatePayout(5000n, 1.17)).toBe(5850n);
    // Zero multiplier
    expect(engine.calculatePayout(100n, 0)).toBe(0n);
  });

  it('should roll step outcomes using CSPRNG', () => {
    const results: boolean[] = [];
    for (let i = 0; i < 100; i++) {
      results.push(engine.rollStep());
    }
    expect(results.some((r) => r === true)).toBe(true);
    expect(results.some((r) => r === false)).toBe(true);
  });

  it('should validate bets and clamp to maximum', () => {
    // Too low
    const tooLow = engine.validateBet(0n, 1000n);
    expect(tooLow.valid).toBe(false);
    expect(tooLow.error).toBe('BET_TOO_LOW');

    // Insufficient funds
    const broke = engine.validateBet(1000n, 500n);
    expect(broke.valid).toBe(false);
    expect(broke.error).toBe('INSUFFICIENT_FUNDS');

    // Clamping to maxBet 250,000
    const clamped = engine.validateBet(500000n, 1000000n);
    expect(clamped.valid).toBe(true);
    expect(clamped.adjustedBet).toBe(250000n);

    // Valid normal bet
    const valid = engine.validateBet(5000n, 10000n);
    expect(valid.valid).toBe(true);
    expect(valid.adjustedBet).toBe(5000n);
  });
});
