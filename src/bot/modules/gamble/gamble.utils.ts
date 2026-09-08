// src/bot/modules/gamble/gamble.utils.ts

/**
 * Format any number or BigInt with standard en-US comma grouping (e.g. 50,000).
 * Never uses dots (.) as thousand separators.
 */
export function formatCash(amount: bigint | number): string {
  return amount.toLocaleString('en-US');
}

export interface ParsedNominalResult {
  valid: boolean;
  amount?: bigint;
  isAll?: boolean;
  error?: string;
}

/**
 * Parses user nominal input supporting:
 * - Plain integers: 10000, 50000
 * - Suffix k / K (thousand): 10k -> 10,000 | 100k -> 100,000 | 2.5k -> 2,500
 * - Suffix m / M (million): 1m -> 1,000,000 | 2.5m -> 2,500,000
 * - Suffix b / B (billion): 1b -> 1,000,000,000
 * - Keyword 'all': all available balance
 * - Strips accidental commas or Indonesian dots (e.g. 10.000 -> 10000)
 */
export function parseNominal(input: string | number | bigint): ParsedNominalResult {
  if (typeof input === 'bigint') {
    if (input <= 0n) return { valid: false, error: 'NON_POSITIVE' };
    return { valid: true, amount: input };
  }

  if (typeof input === 'number') {
    if (input <= 0 || !Number.isFinite(input)) return { valid: false, error: 'NON_POSITIVE' };
    return { valid: true, amount: BigInt(Math.floor(input)) };
  }

  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return { valid: false, error: 'EMPTY' };

  if (raw === 'all') {
    return { valid: true, isAll: true };
  }

  // 1. Shorthand suffixes (k, m, b): e.g. 10k, 100k, 1m, 2.5k
  const suffixMatch = raw.match(/^(\d+(?:\.\d+)?)\s*([kmb])$/i);
  if (suffixMatch) {
    const num = parseFloat(suffixMatch[1]);
    const unit = suffixMatch[2].toLowerCase();
    let multiplier = 1;
    if (unit === 'k') multiplier = 1_000;
    else if (unit === 'm') multiplier = 1_000_000;
    else if (unit === 'b') multiplier = 1_000_000_000;

    const calculated = Math.floor(num * multiplier);
    if (isNaN(calculated) || calculated <= 0) {
      return { valid: false, error: 'INVALID_AMOUNT' };
    }
    return { valid: true, amount: BigInt(calculated) };
  }

  // 2. Clean thousand separators (strip commas or dots if used as Indonesian separators)
  let cleaned = raw.replace(/,/g, '').replace(/_/g, '');
  if (/^\d+(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
  }

  // 3. Integer digits
  if (/^\d+$/.test(cleaned)) {
    try {
      const parsed = BigInt(cleaned);
      if (parsed <= 0n) return { valid: false, error: 'NON_POSITIVE' };
      return { valid: true, amount: parsed };
    } catch {
      return { valid: false, error: 'INVALID_AMOUNT' };
    }
  }

  return { valid: false, error: 'INVALID_FORMAT' };
}
