export interface UsageEvent {
  id: string; // unique per request, used later for idempotent DB inserts
  tenantId: string;
  apiKeyId: string;
  model: string;
  provider: string;
  status: number;
  latencyMs: number;
  ttftMs?: number; // time to first token (streaming only)
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  cacheStatus: "miss" | "exact" | "semantic";
  createdAt: string; // ISO timestamp
}

export interface EventSink {
  /** Must return quickly: it runs on the request path. */
  publish(event: UsageEvent): Promise<void>;
  /** Flush what is pending and release resources. */
  close(): Promise<void>;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** Whole requests/tokens left after this call. */
  remaining: number;
  /** 0 if allowed, otherwise how long to wait before retrying. */
  retryAfterMs: number;
}

export interface RateLimiter {
  consume(key: string, cost?: number): Promise<RateLimitDecision>;
}

export interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}
