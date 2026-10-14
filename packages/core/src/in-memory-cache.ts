import { Cache } from "./types.js";
import { Clock, systemClock } from "./clock.js";

interface CacheEntry {
  value: string;
  expiresAt: number; // timestamp in ms
}

export class InMemoryCache implements Cache {
  private store = new Map<string, CacheEntry>();
  private clock: Clock;

  constructor(clock: Clock = systemClock) {
    this.clock = clock;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= this.clock.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const expiresAt = this.clock.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
