// src/bot/utils/rate-limiter.ts

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private limits = new Map<string, RateLimitRecord>();

  /**
   * @param windowMs Window duration in milliseconds
   * @param maxRequests Maximum requests allowed within the window
   */
  constructor(
    private windowMs: number,
    private maxRequests: number,
  ) {}

  /**
   * Check if a key is rate limited.
   * Returns true if allowed, false if limited.
   */
  public tryAcquire(key: string): boolean {
    const now = Date.now();
    const record = this.limits.get(key);

    if (!record || now > record.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count += 1;
    return true;
  }

  public getRemainingTimeMs(key: string): number {
    const record = this.limits.get(key);
    if (!record) return 0;
    const diff = record.resetAt - Date.now();
    return diff > 0 ? diff : 0;
  }

  public reset(key: string): void {
    this.limits.delete(key);
  }
}
