import { RateLimiter, RateLimitDecision } from "./types.js";
import { Clock, systemClock } from "./clock.js";

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();
  private clock: Clock;
  private maxTokens: number;
  private refillRatePerMs: number;

  constructor(
    maxTokens: number = 60,
    refillIntervalMs: number = 60000,
    clock: Clock = systemClock,
  ) {
    this.maxTokens = maxTokens;
    this.refillRatePerMs = maxTokens / refillIntervalMs;
    this.clock = clock;
  }

  async consume(key: string, cost: number = 1): Promise<RateLimitDecision> {
    const now = this.clock.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    if (elapsed > 0) {
      const refill = elapsed * this.refillRatePerMs;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: 0,
      };
    }

    const deficit = cost - bucket.tokens;
    const retryAfterMs = Math.ceil(deficit / this.refillRatePerMs);

    return {
      allowed: false,
      remaining: Math.floor(bucket.tokens),
      retryAfterMs,
    };
  }
}
