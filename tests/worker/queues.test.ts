import { describe, expect, it } from "vitest";
import { normalizeLiveData } from "../../worker/index";
import { attractions } from "../../src/disney/data/attractions";

describe("park queue worker", () => {
  it("normalizes standby, return-time, and operating fields", () => {
    const fetchedAt = "2026-08-16T12:00:00.000Z";
    const result = normalizeLiveData({ liveData: [{
      id: "ride-1",
      name: "Example Ride",
      entityType: "ATTRACTION",
      status: "DOWN",
      lastUpdated: "2026-08-16T11:59:00.000Z",
      queue: { STANDBY: { waitTime: null }, RETURN_TIME: { state: "TEMP_FULL", returnStart: null, returnEnd: null } },
    }, { id: "show-1", name: "A Show", entityType: "SHOW", status: "OPERATING" }] }, "disneyland", fetchedAt);
    expect(result.items).toEqual([{
      sourceEntityId: "ride-1",
      name: "Example Ride",
      operatingStatus: "down",
      standbyMinutes: null,
      returnTime: { state: "temp-full", start: null, end: null },
      lastUpdatedAt: "2026-08-16T11:59:00.000Z",
    }]);
  });

  it("falls back safely for unknown upstream values", () => {
    const fetchedAt = "2026-08-16T12:00:00.000Z";
    const result = normalizeLiveData({ liveData: [{ id: "ride-2", name: "New Ride", entityType: "ATTRACTION", status: "PAUSED", queue: { PAID_RETURN_TIME: { state: "NEW_STATE" } } }] }, "california-adventure", fetchedAt);
    expect(result.items[0]).toMatchObject({ operatingStatus: "unknown", standbyMinutes: null, returnTime: { state: "unknown" }, lastUpdatedAt: fetchedAt });
  });

  it("keeps mapped entity IDs unique within the attraction catalog", () => {
    const ids = attractions.flatMap((ride) => ride.externalEntityId ? [ride.externalEntityId] : []);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(50);
  });
});
