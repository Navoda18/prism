import { describe, it, expect, beforeEach } from "vitest";
import { EventSink, UsageEvent } from "./types.js";
import { InMemoryEventSink } from "./in-memory-event-sink.js";

export function runEventSinkContractTests(
  createSink: () => EventSink & { getEvents(): UsageEvent[] },
) {
  describe("EventSink Contract Tests", () => {
    let sink: EventSink & { getEvents(): UsageEvent[]; clear(): void };

    beforeEach(() => {
      sink = createSink();
      sink.clear();
    });

    it("publishes usage events successfully", async () => {
      const event: UsageEvent = {
        id: "evt_123",
        tenantId: "tenant_abc",
        apiKeyId: "key_xyz",
        model: "gpt-4",
        provider: "openai",
        status: 200,
        latencyMs: 450,
        promptTokens: 100,
        completionTokens: 50,
        costUsd: 0.003,
        cacheStatus: "miss",
        createdAt: new Date().toISOString(),
      };

      await sink.publish(event);
      const events = sink.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);
    });

    it("closes cleanly without throwing errors", async () => {
      await expect(sink.close()).resolves.toBeUndefined();
    });
  });
}

// Run the contract suite against InMemoryEventSink
describe("InMemoryEventSink", () => {
  runEventSinkContractTests(() => new InMemoryEventSink());
});
