import crypto from 'crypto';

export const CAT_WALK_MULTIPLIERS: readonly number[] = [
  0,
  1.17, // Step 1 (1.17x)
  1.47, // Step 2 (1.47x)
  1.84, // Step 3 (1.84x)
  2.29, // Step 4 (2.29x)
  2.87, // Step 5 (2.87x)
  3.59, // Step 6 (3.59x)
  4.48, // Step 7 (4.48x)
  5.60, // Step 8 (5.60x)
  7.00, // Step 9 (7.00x)
  8.75, // Step 10 (8.75x MAX WIN)
] as const;

export class CatWalkEngine {
  public readonly totalSteps = 10;
  public readonly failureRate = 0.20; // 20.00% failure chance per step
  public readonly successRate = 0.80; // 80.00% success chance per step

  /**
   * Get multiplier for a given step (1 to 10)
   */
  public calculateMultiplier(step: number): number {
    if (step <= 0) return 0;
    if (step >= this.totalSteps) return CAT_WALK_MULTIPLIERS[this.totalSteps];
    return CAT_WALK_MULTIPLIERS[step];
  }

  /**
   * Calculate payout from bet and multiplier
   */
  public calculatePayout(bet: bigint, multiplier: number): bigint {
    if (multiplier <= 0) return 0n;
    const scaled = BigInt(Math.round(multiplier * 100));
    return (bet * scaled) / 100n;
  }

  /**
   * Roll step outcome using CSPRNG:
   * 1..20 = false (20% failure)
   * 21..100 = true (80% success)
   */
  public rollStep(): boolean {
    const roll = crypto.randomInt(1, 101);
    return roll > 20;
  }

  /**
   * Validate bet amount against user's cash balance
   */
  public validateBet(
    bet: bigint,
    userCash: bigint,
    minBet = 1n,
    maxBet = 250000n,
  ): { valid: boolean; error?: string; adjustedBet: bigint } {
    if (bet < minBet) {
      return { valid: false, error: 'BET_TOO_LOW', adjustedBet: 0n };
    }
    const adjustedBet = bet > maxBet ? maxBet : bet;
    if (userCash < adjustedBet || userCash <= 0n) {
      return { valid: false, error: 'INSUFFICIENT_FUNDS', adjustedBet: 0n };
    }
    return { valid: true, adjustedBet };
  }
}
