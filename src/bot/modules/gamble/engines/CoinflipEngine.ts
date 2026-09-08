// src/bot/modules/gamble/engines/CoinflipEngine.ts
import crypto from 'crypto';
import type { CoinflipSide, BetValidationResult } from '../gamble.types';
import { parseNominal } from '../gamble.utils';

export interface ParseChoiceResult {
  valid: boolean;
  choice?: CoinflipSide;
  wasRandom?: boolean;
  error?: string;
}

export class CoinflipEngine {
  public readonly minBet: bigint = 1n;
  public readonly maxBet: bigint = 250000n;

  /**
   * Parse user choice or randomly pick heads/tails if omitted
   */
  public parseChoice(rawChoice?: string | null): ParseChoiceResult {
    if (!rawChoice || !rawChoice.trim()) {
      // Pick random choice for user
      const randomChoice: CoinflipSide = crypto.randomInt(0, 2) === 0 ? 'heads' : 'tails';
      return { valid: true, choice: randomChoice, wasRandom: true };
    }

    const normalized = rawChoice.trim().toLowerCase();
    if (normalized === 'h' || normalized === 'head' || normalized === 'heads') {
      return { valid: true, choice: 'heads', wasRandom: false };
    }
    if (normalized === 't' || normalized === 'tail' || normalized === 'tails') {
      return { valid: true, choice: 'tails', wasRandom: false };
    }

    return { valid: false, error: 'INVALID_CHOICE' };
  }

  /**
   * Validate bet amount against user cash balance
   */
  public validateBet(betInput: string | number | bigint, userCash: bigint): BetValidationResult {
    const parsed = parseNominal(betInput);
    if (!parsed.valid) {
      if (parsed.error === 'NON_POSITIVE') {
        return { valid: false, error: 'BET_TOO_LOW', minBet: Number(this.minBet) };
      }
      return { valid: false, error: 'INVALID_FORMAT' };
    }

    if (userCash <= 0n) {
      return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userCash };
    }

    let bet = parsed.isAll ? userCash : (parsed.amount || 0n);

    if (bet < this.minBet) {
      return { valid: false, error: 'BET_TOO_LOW', minBet: Number(this.minBet) };
    }

    if (bet > this.maxBet) {
      bet = this.maxBet;
    }

    if (userCash < bet) {
      return { valid: false, error: 'INSUFFICIENT_FUNDS', balance: userCash };
    }

    return { valid: true, amount: bet };
  }

  /**
   * Flip the coin using CSPRNG 50/50 odds
   */
  public flip(): CoinflipSide {
    return crypto.randomInt(0, 2) === 0 ? 'heads' : 'tails';
  }

  /**
   * Calculate outcome: payout and profit
   */
  public evaluate(userChoice: CoinflipSide, outcomeSide: CoinflipSide, bet: bigint): { won: boolean; payout: bigint; netProfit: bigint } {
    const won = userChoice === outcomeSide;
    if (won) {
      const payout = bet * 2n;
      return { won: true, payout, netProfit: bet };
    }
    return { won: false, payout: 0n, netProfit: -bet };
  }
}
