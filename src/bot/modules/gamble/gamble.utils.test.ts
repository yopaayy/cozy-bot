// src/bot/modules/gamble/gamble.utils.test.ts
import { describe, it, expect } from 'vitest';
import { parseNominal, formatCash } from './gamble.utils';

describe('gamble.utils', () => {
  describe('parseNominal', () => {
    it('should parse plain numbers and bigints', () => {
      expect(parseNominal(10000).amount).toBe(10000n);
      expect(parseNominal(200000).amount).toBe(200000n);
      expect(parseNominal(1000000n).amount).toBe(1000000n);
      expect(parseNominal('10000').amount).toBe(10000n);
      expect(parseNominal('200000').amount).toBe(200000n);
      expect(parseNominal('1000000').amount).toBe(1000000n);
    });

    it('should parse shorthand suffix k / K (thousands)', () => {
      expect(parseNominal('10k').amount).toBe(10000n);
      expect(parseNominal('10K').amount).toBe(10000n);
      expect(parseNominal('100k').amount).toBe(100000n);
      expect(parseNominal('200k').amount).toBe(200000n);
      expect(parseNominal('2.5k').amount).toBe(2500n);
      expect(parseNominal('10 k').amount).toBe(10000n);
    });

    it('should parse shorthand suffix m / M (millions)', () => {
      expect(parseNominal('1m').amount).toBe(1000000n);
      expect(parseNominal('1M').amount).toBe(1000000n);
      expect(parseNominal('2.5m').amount).toBe(2500000n);
      expect(parseNominal('10m').amount).toBe(10000000n);
    });

    it('should parse shorthand suffix b / B (billions)', () => {
      expect(parseNominal('1b').amount).toBe(1000000000n);
      expect(parseNominal('1B').amount).toBe(1000000000n);
    });

    it('should parse keyword "all"', () => {
      const res = parseNominal('all');
      expect(res.valid).toBe(true);
      expect(res.isAll).toBe(true);

      const resUpper = parseNominal('ALL');
      expect(resUpper.valid).toBe(true);
      expect(resUpper.isAll).toBe(true);
    });

    it('should strip accidental thousand separator dots or commas', () => {
      expect(parseNominal('10.000').amount).toBe(10000n);
      expect(parseNominal('1.000.000').amount).toBe(1000000n);
      expect(parseNominal('10,000').amount).toBe(10000n);
      expect(parseNominal('1,000,000').amount).toBe(1000000n);
    });

    it('should reject invalid, zero, or negative inputs', () => {
      expect(parseNominal(0).valid).toBe(false);
      expect(parseNominal(-500).valid).toBe(false);
      expect(parseNominal('0').valid).toBe(false);
      expect(parseNominal('-10k').valid).toBe(false);
      expect(parseNominal('abc').valid).toBe(false);
      expect(parseNominal('').valid).toBe(false);
    });
  });

  describe('formatCash', () => {
    it('should format numbers with comma separation and no dots', () => {
      expect(formatCash(50000)).toBe('50,000');
      expect(formatCash(50000n)).toBe('50,000');
      expect(formatCash(29696n)).toBe('29,696');
      expect(formatCash(20304n)).toBe('20,304');
      expect(formatCash(9696n)).toBe('9,696');
      expect(formatCash(1000000n)).toBe('1,000,000');

      // Verify no dots (.) exist anywhere in integer formatting
      expect(formatCash(50000)).not.toContain('.');
      expect(formatCash(29696n)).not.toContain('.');
      expect(formatCash(20304n)).not.toContain('.');
    });
  });
});
