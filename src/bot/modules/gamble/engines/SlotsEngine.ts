// src/bot/modules/gamble/engines/SlotsEngine.ts
import crypto from 'crypto';
import type { SlotSymbolKey, SlotsResult, BetValidationResult } from '../gamble.types';
import { parseNominal } from '../gamble.utils';

export class SlotsEngine {
  public readonly minBet: bigint;
  public readonly maxBet: bigint;

  public readonly symbols: SlotSymbolKey[] = [
    'slotsitem1', // Simbol 1 (1x)
    'slotsitem2', // Simbol 2 (2x)
    'slotsitem3', // Simbol 3 (5x)
    'slotsitem4', // Simbol Jackpot Part 1
    'slotsitem5', // Simbol Jackpot Part 2
  ];

  constructor(options?: { minBet?: number | bigint; maxBet?: number | bigint }) {
    this.minBet = options?.minBet ? BigInt(options.minBet) : 1n;
    this.maxBet = options?.maxBet ? BigInt(options.maxBet) : 250000n;
  }

  /**
   * Validate bet input against user's current cash balance
   */
  public validateBet(betInput: string | number | bigint, userBalance: bigint): BetValidationResult {
    const parsed = parseNominal(betInput);
    if (!parsed.valid) {
      return { valid: false, error: 'INVALID_BET_FORMAT' };
    }

    let betAmount = parsed.isAll ? userBalance : (parsed.amount || 0n);

    if (betAmount < this.minBet) {
      return { valid: false, error: 'BET_TOO_LOW', minBet: Number(this.minBet) };
    }

    if (userBalance < betAmount || userBalance <= 0n) {
      return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userBalance };
    }

    if (this.maxBet && betAmount > this.maxBet) {
      betAmount = this.maxBet;
    }

    return { valid: true, amount: betAmount };
  }

  /**
   * Spin the slot machine (CSPRNG 95.0% RTP)
   */
  public spin(betInput: string | number | bigint, userBalance: bigint): SlotsResult {
    const validation = this.validateBet(betInput, userBalance);
    if (!validation.valid || validation.amount === undefined) {
      throw new Error(validation.error || 'INVALID_BET');
    }

    const bet = validation.amount;
    // crypto.randomInt(1, 1001) returns integer 1..1000 -> 0.1 to 100.0
    const rand = crypto.randomInt(1, 1001) / 10;

    let multiplier = 0;
    let reels: [SlotSymbolKey, SlotSymbolKey, SlotSymbolKey];
    let winTier: '1x' | '2x' | '5x' | '10x_jackpot' | 'loss' = 'loss';

    if (rand <= 20.0) {
      // 20.0% probability -> 1x (Break Even)
      multiplier = 1;
      reels = ['slotsitem1', 'slotsitem1', 'slotsitem1'];
      winTier = '1x';
    } else if (rand <= 40.0) {
      // 20.0% probability -> 2x (Double Win)
      multiplier = 2;
      reels = ['slotsitem2', 'slotsitem2', 'slotsitem2'];
      winTier = '2x';
    } else if (rand <= 45.0) {
      // 5.0% probability -> 5x (Big Win)
      multiplier = 5;
      reels = ['slotsitem3', 'slotsitem3', 'slotsitem3'];
      winTier = '5x';
    } else if (rand <= 46.1) {
      // 1.0% probability (45.1 - 46.1) -> 10x JACKPOT (item4 - item5 - item4)
      multiplier = 10;
      reels = ['slotsitem4', 'slotsitem5', 'slotsitem4'];
      winTier = '10x_jackpot';
    } else {
      // 53.9% probability -> Loss
      multiplier = 0;
      winTier = 'loss';
      reels = this.generateLosingReels();
    }

    const won = multiplier > 0;
    const payout = bet * BigInt(multiplier);
    const netProfit = payout - bet;
    const newBalance = userBalance + netProfit;

    return {
      success: true,
      bet,
      multiplier,
      payout,
      netProfit,
      won,
      winTier,
      reels,
      rollValue: rand,
      previousBalance: userBalance,
      newBalance,
      timestamp: Date.now(),
    };
  }

  /**
   * Generates losing reels (never 3 identical, and never item4-item5-item4)
   */
  public generateLosingReels(): [SlotSymbolKey, SlotSymbolKey, SlotSymbolKey] {
    const len = this.symbols.length;
    let idx1 = crypto.randomInt(0, len);
    let idx2 = crypto.randomInt(0, len);
    let idx3 = crypto.randomInt(0, len);

    // If all 3 are identical, adjust the 2nd
    if (idx1 === idx2 && idx2 === idx3) {
      idx2 = (idx1 + 1) % len;
    }

    // If matches jackpot combo [item4, item5, item4]
    if (this.symbols[idx1] === 'slotsitem4' && this.symbols[idx2] === 'slotsitem5' && this.symbols[idx3] === 'slotsitem4') {
      idx2 = 0; // change middle to item1
    }

    return [this.symbols[idx1], this.symbols[idx2], this.symbols[idx3]];
  }
}
