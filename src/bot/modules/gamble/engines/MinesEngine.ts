// src/bot/modules/gamble/engines/MinesEngine.ts
import crypto from 'crypto';

export interface MinesEngineOptions {
  totalTiles?: number;
  minMines?: number;
  maxMines?: number;
  rtp?: number;
}

export class MinesEngine {
  public readonly totalTiles: number;
  public readonly minMines: number;
  public readonly maxMines: number;
  public readonly rtp: number;

  constructor(options?: MinesEngineOptions) {
    this.totalTiles = options?.totalTiles ?? 9;
    this.minMines = options?.minMines ?? 1;
    this.maxMines = options?.maxMines ?? 8;
    this.rtp = options?.rtp ?? 0.9334;
  }

  /**
   * Generates cryptographically secure random unique mine indices (0 to totalTiles - 1)
   */
  public generateMines(minesCount: number): Set<number> {
    const clampedMines = Math.max(this.minMines, Math.min(this.maxMines, minesCount));
    const mines = new Set<number>();

    while (mines.size < clampedMines) {
      const idx = crypto.randomInt(0, this.totalTiles);
      mines.add(idx);
    }

    return mines;
  }

  /**
   * Calculate multiplier based on mines count and gems picked so far (95% RTP).
   */
  public calculateMultiplier(minesCount: number, gemsPicked: number): number {
    if (gemsPicked <= 0) return 1.0;

    const safeTiles = this.totalTiles - minesCount;
    if (gemsPicked > safeTiles) return 1.0;

    let probability = 1.0;
    for (let i = 0; i < gemsPicked; i++) {
      probability *= (safeTiles - i) / (this.totalTiles - i);
    }

    if (probability <= 0) return 1.0;

    const rawMultiplier = this.rtp / probability;
    // Round to 2 decimal places (downward for house integrity)
    return Math.max(1.01, Math.floor(rawMultiplier * 100) / 100);
  }

  /**
   * Calculate precise payout using BigInt scaled math to prevent float overflow
   */
  public calculatePayout(bet: bigint, multiplier: number): bigint {
    if (multiplier <= 0) return 0n;
    const scaled = BigInt(Math.round(multiplier * 100));
    return (bet * scaled) / 100n;
  }
}
