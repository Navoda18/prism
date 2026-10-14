import { EventSink, UsageEvent } from "./types.js";

export class InMemoryEventSink implements EventSink {
  private events: UsageEvent[] = [];

  async publish(event: UsageEvent): Promise<void> {
    this.events.push(event);
  }

  async close(): Promise<void> {
    // No external connections to close for in-memory sink
  }

  /** Helper method for testing or inspecting buffered events */
  getEvents(): UsageEvent[] {
    return [...this.events];
  }

  /** Helper method to clear buffered events */
  clear(): void {
    this.events = [];
  }
}
