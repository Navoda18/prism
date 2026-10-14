import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "./types.js";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter.js";
import { Clock } from "./clock.js";

class MockClock implements Clock {
  private time = 1000;
  now(): number {
    return this.time;
  }
  advance(ms: number): void {
    this.time += ms;
  }
}

export function runRateLimiterContractTests(
  createRateLimiter: (maxTokens: number, windowMs: number, clock: Clock) => RateLimiter,
) {
  describe("RateLimiter Contract Tests", () => {
    let clock: MockClock;
    let limiter: RateLimiter;

    beforeEach(() => {
      clock = new MockClock();
      // Max 5 tokens per 10000ms (10 seconds)
      limiter = createRateLimiter(5, 10000, clock);
    });

    it("allows requests within the limit", async () => {
      const decision = await limiter.consume("client-1", 2);
      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(3);
      expect(decision.retryAfterMs).toBe(0);
    });

    it("blocks requests that exceed available tokens", async () => {
      // Consume all 5 tokens
      await limiter.consume("client-1", 5);

      // Try to consume 1 more
      const decision = await limiter.consume("client-1", 1);
      expect(decision.allowed).toBe(false);
      expect(decision.remaining).toBe(0);
      expect(decision.retryAfterMs).toBeGreaterThan(0);
    });

    it("refills tokens over time", async () => {
      // Drain all tokens
      await limiter.consume("client-1", 5);
      expect((await limiter.consume("client-1", 1)).allowed).toBe(false);

      // Advance time by 5 seconds (half of the 10s window, should refill ~2.5 tokens)
      clock.advance(5000);

      // Should now allow a cost of 2
      const decision = await limiter.consume("client-1", 2);
      expect(decision.allowed).toBe(true);
    });
  });
}

// Run the contract suite against InMemoryRateLimiter
describe("InMemoryRateLimiter", () => {
  runRateLimiterContractTests((max, window, clock) => new InMemoryRateLimiter(max, window, clock));
});
