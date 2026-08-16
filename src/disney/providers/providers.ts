import { attractionsForPark } from "../data/attractions";
import type { AttractionStatus, DisneylandDataProvider, ParkId } from "../types";

export class ManualDataProvider implements DisneylandDataProvider {
  constructor(private readonly states: Record<string, AttractionStatus>) {}
  async getAttractionStatus(parkId: ParkId) {
    return attractionsForPark(parkId).flatMap((attraction) => this.states[attraction.id] ? [this.states[attraction.id]] : []);
  }
}

export class MockDataProvider implements DisneylandDataProvider {
  constructor(private readonly now = new Date()) {}
  async getAttractionStatus(parkId: ParkId) {
    const openedAt = this.now.getHours() + this.now.getMinutes() / 60;
    return attractionsForPark(parkId).map((attraction, index): AttractionStatus => {
      const demand = attraction.historicalDemand === "very-high" ? 55 : attraction.historicalDemand === "high" ? 35 : attraction.historicalDemand === "medium" ? 20 : 10;
      const midday = Math.max(0, 1 - Math.abs(openedAt - 14) / 8);
      const standbyMinutes = Math.max(5, Math.round((demand + midday * demand * 0.65 + (index % 4) * 5) / 5) * 5);
      const returnTime = new Date(this.now.getTime() + (standbyMinutes + index * 4) * 60000);
      return {
        attractionId: attraction.id,
        standbyMinutes,
        lightningLaneReturnStart: attraction.lightningLane ? returnTime.toISOString() : undefined,
        lightningLaneReturnEnd: attraction.lightningLane ? new Date(returnTime.getTime() + 3600000).toISOString() : undefined,
        temporarilyUnavailable: index % 17 === 0 && openedAt > 12,
        lastUpdatedAt: this.now.toISOString(),
        source: "mock",
      };
    });
  }
}
