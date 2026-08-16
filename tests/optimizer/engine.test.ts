import { describe, expect, it } from "vitest";
import { createInitialState, disneyReducer } from "../../src/disney/state/store";
import { recommendBookNext, recommendNow, scarcityVelocity } from "../../src/disney/optimizer/engine";
import type { AttractionPreference, DayState } from "../../src/disney/types";

const now = new Date("2026-08-18T10:00:00-07:00");
const pref = (attractionId: string, tier: AttractionPreference["tier"], rankWithinTier = 1): AttractionPreference => ({ attractionId, tier, rankWithinTier });

function day(): DayState {
  return structuredClone(createInitialState(true).days.disneyland);
}

describe("current-action optimizer", () => {
  it("asks for data when no candidate has a known wait", () => {
    expect(recommendNow(day(), [pref("indiana-jones", "must")], now).type).toBe("WAIT");
  });

  it("chooses a directly-nearby Nice opportunity over a bad cross-park Must Do", () => {
    const state = day();
    state.currentLand = "Fantasyland";
    state.attractionStates = {
      matterhorn: { attractionId: "matterhorn", standbyMinutes: 10, lastUpdatedAt: now.toISOString(), source: "manual" },
      "indiana-jones": { attractionId: "indiana-jones", standbyMinutes: 55, lastUpdatedAt: now.toISOString(), source: "manual" },
    };
    const action = recommendNow(state, [pref("matterhorn", "nice"), pref("indiana-jones", "must")], now);
    expect(action.attractionId).toBe("matterhorn");
    expect(action.reason).toContain("nearby");
  });

  it("rejects a cross-park Convenient detour", () => {
    const state = day();
    state.currentLand = "Tomorrowland";
    state.attractionStates["winnie-pooh"] = { attractionId: "winnie-pooh", standbyMinutes: 5, lastUpdatedAt: now.toISOString() };
    expect(recommendNow(state, [pref("winnie-pooh", "convenient")], now).type).toBe("WAIT");
  });

  it("prioritizes a held lane that is nearly expired", () => {
    const state = day();
    state.currentLand = "Adventureland";
    state.reservations.push({ id: "one", attractionId: "space-mountain", bookedAt: new Date(now.getTime() - 120 * 60000).toISOString(), returnStart: new Date(now.getTime() - 40 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 20 * 60000).toISOString(), status: "held" });
    state.attractionStates["indiana-jones"] = { attractionId: "indiana-jones", standbyMinutes: 15, lastUpdatedAt: now.toISOString() };
    const action = recommendNow(state, [pref("space-mountain", "must"), pref("indiana-jones", "must", 2)], now);
    expect(action.type).toBe("USE_HELD_LIGHTNING_LANE");
    expect(action.attractionId).toBe("space-mountain");
  });

  it("does not assume an unavailable ride is operating", () => {
    const state = day();
    state.attractionStates["indiana-jones"] = { attractionId: "indiana-jones", standbyMinutes: 5, temporarilyUnavailable: true, lastUpdatedAt: now.toISOString() };
    expect(recommendNow(state, [pref("indiana-jones", "must")], now).type).toBe("WAIT");
  });

  it("increases effort penalties when the user becomes tired", () => {
    const good = day();
    good.currentLand = "Tomorrowland";
    good.fatigueLevel = "good";
    good.attractionStates["indiana-jones"] = { attractionId: "indiana-jones", standbyMinutes: 20, lastUpdatedAt: now.toISOString() };
    const tired = structuredClone(good);
    tired.fatigueLevel = "tired";
    expect(recommendNow(tired, [pref("indiana-jones", "nice")], now).score).toBeLessThan(recommendNow(good, [pref("indiana-jones", "nice")], now).score);
  });

  it("discounts stale observations", () => {
    const fresh = day();
    fresh.attractionStates.matterhorn = { attractionId: "matterhorn", standbyMinutes: 10, lastUpdatedAt: now.toISOString() };
    const stale = structuredClone(fresh);
    stale.attractionStates.matterhorn.lastUpdatedAt = new Date(now.getTime() - 20 * 60000).toISOString();
    expect(recommendNow(stale, [pref("matterhorn", "nice")], now).score).toBeLessThan(recommendNow(fresh, [pref("matterhorn", "nice")], now).score);
  });

  it("raises unfinished Must Do urgency near closing", () => {
    const state = day();
    state.attractionStates["indiana-jones"] = { attractionId: "indiana-jones", standbyMinutes: 45, lastUpdatedAt: now.toISOString() };
    const midday = recommendNow(state, [pref("indiana-jones", "must")], now);
    const late = new Date("2026-08-18T23:20:00-07:00");
    state.attractionStates["indiana-jones"].lastUpdatedAt = late.toISOString();
    expect(recommendNow(state, [pref("indiana-jones", "must")], late).score).toBeGreaterThan(midday.score);
  });

  it("orders overlapping reservations by expiration risk", () => {
    const state = day();
    state.reservations = [
      { id: "future", attractionId: "space-mountain", bookedAt: now.toISOString(), returnStart: new Date(now.getTime() + 20 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 80 * 60000).toISOString(), status: "held" },
      { id: "soon", attractionId: "haunted-mansion", bookedAt: now.toISOString(), returnStart: new Date(now.getTime() - 30 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 15 * 60000).toISOString(), status: "held" },
      { id: "later", attractionId: "big-thunder", bookedAt: now.toISOString(), returnStart: new Date(now.getTime() + 35 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 95 * 60000).toISOString(), status: "held" },
    ];
    const action = recommendNow(state, [pref("space-mountain", "must"), pref("haunted-mansion", "must", 2), pref("big-thunder", "must", 3)], now);
    expect(action.attractionId).toBe("haunted-mansion");
  });
});

describe("Lightning Lane optimizer", () => {
  it("does not recommend a Single Pass attraction", () => {
    const state = day();
    const action = recommendBookNext(state, [pref("rise-resistance", "must")], now);
    expect(action).toBeUndefined();
  });

  it("does not recommend booking while the timer is active", () => {
    const state = day();
    state.nextLightningLaneEligibleAt = new Date(now.getTime() + 30 * 60000).toISOString();
    expect(recommendBookNext(state, [pref("space-mountain", "must")], now)).toBeUndefined();
  });

  it("recommends again when the eligibility timer expires", () => {
    const state = day();
    state.nextLightningLaneEligibleAt = new Date(now.getTime() - 1000).toISOString();
    expect(recommendBookNext(state, [pref("space-mountain", "must")], now)?.attractionId).toBe("space-mountain");
  });

  it("tracks return-time velocity and recommends a scarce Must Do", () => {
    const state = day();
    state.attractionStates["space-mountain"] = { attractionId: "space-mountain", standbyMinutes: 65, lightningLaneReturnStart: new Date(now.getTime() + 180 * 60000).toISOString(), lastUpdatedAt: now.toISOString() };
    state.llObservations = [
      { attractionId: "space-mountain", observedAt: new Date(now.getTime() - 20 * 60000).toISOString(), returnTime: new Date(now.getTime() + 20 * 60000).toISOString() },
      { attractionId: "space-mountain", observedAt: now.toISOString(), returnTime: new Date(now.getTime() + 180 * 60000).toISOString() },
    ];
    expect(scarcityVelocity(state, "space-mountain")).toBeGreaterThan(2);
    const action = recommendBookNext(state, [pref("space-mountain", "must")], now);
    expect(action?.attractionId).toBe("space-mountain");
    expect(action?.estimatedMinutesSaved).toBe(53);
  });

  it("does not recommend an attraction already booked that day", () => {
    const state = day();
    state.reservations.push({ id: "one", attractionId: "space-mountain", bookedAt: now.toISOString(), returnStart: now.toISOString(), returnEnd: new Date(now.getTime() + 60 * 60000).toISOString(), status: "cancelled" });
    expect(recommendBookNext(state, [pref("space-mountain", "must")], now)?.attractionId).toBe("space-mountain");
    state.reservations[0].status = "redeemed";
    expect(recommendBookNext(state, [pref("space-mountain", "must")], now)).toBeUndefined();
  });
});

describe("day-state transitions", () => {
  it("supports multiple held reservations, modification, redemption, and timer correction", () => {
    let state = createInitialState(false);
    state = disneyReducer(state, { type: "BOOK_RESERVATION", parkId: "disneyland", reservation: { id: "one", attractionId: "space-mountain", bookedAt: now.toISOString(), returnStart: new Date(now.getTime() + 60 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 120 * 60000).toISOString(), status: "held" } });
    state = disneyReducer(state, { type: "BOOK_RESERVATION", parkId: "disneyland", reservation: { id: "two", attractionId: "big-thunder", bookedAt: now.toISOString(), returnStart: new Date(now.getTime() + 120 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 180 * 60000).toISOString(), status: "held" } });
    state = disneyReducer(state, { type: "MODIFY_RESERVATION", parkId: "disneyland", id: "two", returnStart: new Date(now.getTime() + 90 * 60000).toISOString(), returnEnd: new Date(now.getTime() + 150 * 60000).toISOString(), at: now.toISOString() });
    expect(state.days.disneyland.reservations).toHaveLength(2);
    expect(state.days.disneyland.reservations[1].modifiedAt).toBe(now.toISOString());
    state = disneyReducer(state, { type: "SET_RESERVATION_STATUS", parkId: "disneyland", id: "one", status: "redeemed", at: now.toISOString() });
    expect(state.days.disneyland.nextLightningLaneEligibleAt).toBe(now.toISOString());
    expect(state.days.disneyland.reservations[0].status).toBe("redeemed");
  });
});
