// src/bot/modules/gamble/engines/MinesEngine.test.ts
import { describe, it, expect } from 'vitest';
import { MinesEngine } from './MinesEngine';

describe('MinesEngine', () => {
  const engine = new MinesEngine({ totalTiles: 9, minMines: 1, maxMines: 8, rtp: 0.9334 });

  describe('generateMines', () => {
    it('should generate exact requested number of unique mines within 0..8', () => {
      const mines3 = engine.generateMines(3);
      expect(mines3.size).toBe(3);
      for (const idx of mines3) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(9);
      }

      const mines5 = engine.generateMines(5);
      expect(mines5.size).toBe(5);
      for (const idx of mines5) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(9);
      }
    });

    it('should clamp mines count between 1 and 8', () => {
      const minClamp = engine.generateMines(0);
      expect(minClamp.size).toBe(1);

      const maxClamp = engine.generateMines(30);
      expect(maxClamp.size).toBe(8);
    });
  });

  describe('calculateMultiplier', () => {
    it('should produce exact 1.40x multiplier for 3 mines and 1 safe gem as in reference', () => {
      const m1 = engine.calculateMultiplier(3, 1);
      expect(m1).toBe(1.4);
      expect(engine.calculatePayout(10n, m1)).toBe(14n);
    });

    it('should increase monotonically as gems picked increases', () => {
      const m1 = engine.calculateMultiplier(3, 1);
      const m2 = engine.calculateMultiplier(3, 2);
      const m3 = engine.calculateMultiplier(3, 3);
      const m5 = engine.calculateMultiplier(3, 5);

      expect(m1).toBeGreaterThanOrEqual(1.01);
      expect(m2).toBeGreaterThan(m1);
      expect(m3).toBeGreaterThan(m2);
      expect(m5).toBeGreaterThan(m3);
    });

    it('should yield higher multipliers for higher mines count at same gems count', () => {
      const lowRisk = engine.calculateMultiplier(1, 2);
      const medRisk = engine.calculateMultiplier(3, 2);
      const highRisk = engine.calculateMultiplier(6, 2);

      expect(medRisk).toBeGreaterThan(lowRisk);
      expect(highRisk).toBeGreaterThan(medRisk);
    });

    it('should return 1.0 for 0 gems picked', () => {
      expect(engine.calculateMultiplier(3, 0)).toBe(1.0);
    });
  });

  describe('calculatePayout', () => {
    it('should calculate accurate scaled payout without float precision loss', () => {
      expect(engine.calculatePayout(10000n, 1.5)).toBe(15000n);
      expect(engine.calculatePayout(50000n, 2.05)).toBe(102500n);
      expect(engine.calculatePayout(1000000n, 3.12)).toBe(3120000n);
      expect(engine.calculatePayout(10000n, 0)).toBe(0n);
    });
  });
});
