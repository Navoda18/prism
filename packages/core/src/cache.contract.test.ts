import { describe, it, expect, beforeEach } from "vitest";
import { Cache } from "./types.js";
import { InMemoryCache } from "./in-memory-cache.js";
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

export function runCacheContractTests(createCache: (clock: Clock) => Cache) {
  describe("Cache Contract Tests", () => {
    let clock: MockClock;
    let cache: Cache;

    beforeEach(() => {
      clock = new MockClock();
      cache = createCache(clock);
    });

    it("returns null for a non-existent key", async () => {
      const val = await cache.get("missing");
      expect(val).toBeNull();
    });

    it("stores and retrieves a value before TTL expires", async () => {
      await cache.set("foo", "bar", 10); // 10 seconds TTL
      const val = await cache.get("foo");
      expect(val).toBe("bar");
    });

    it("expires the value after TTL passes", async () => {
      await cache.set("foo", "bar", 2); // 2 seconds TTL
      expect(await cache.get("foo")).toBe("bar");

      // Advance clock past 2 seconds (2000ms)
      clock.advance(2500);

      expect(await cache.get("foo")).toBeNull();
    });

    it("deletes a key successfully", async () => {
      await cache.set("foo", "bar", 10);
      await cache.delete("foo");
      expect(await cache.get("foo")).toBeNull();
    });
  });
}

// Run the contract suite against InMemoryCache
describe("InMemoryCache", () => {
  runCacheContractTests((clock) => new InMemoryCache(clock));
});
