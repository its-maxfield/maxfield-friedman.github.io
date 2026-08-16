import { attractionsForPark } from "../data/attractions";
import type { AttractionStatus, DisneylandDataProvider, ParkId, ParkQueuesResponse } from "../types";

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

export class LiveDataProvider implements DisneylandDataProvider {
  async getParkQueues(parkId: ParkId) {
    const response = await fetch(`/api/parks/${parkId}/queues/`, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? `Live queue refresh failed (${response.status})`);
    }
    const payload = await response.json() as ParkQueuesResponse;
    const byExternalId = new Map(attractionsForPark(parkId).filter((ride) => ride.externalEntityId).map((ride) => [ride.externalEntityId, ride]));
    const statuses = payload.items.flatMap((item): AttractionStatus[] => {
      const attraction = byExternalId.get(item.sourceEntityId);
      if (!attraction) return [];
      return [{
        attractionId: attraction.id,
        standbyMinutes: item.standbyMinutes ?? undefined,
        lightningLaneReturnStart: item.returnTime?.start ?? undefined,
        lightningLaneReturnEnd: item.returnTime?.end ?? undefined,
        lightningLaneAvailability: item.returnTime?.state,
        temporarilyUnavailable: item.operatingStatus !== "operating",
        operatingStatus: item.operatingStatus,
        lastUpdatedAt: item.lastUpdatedAt,
        source: "live",
      }];
    });
    return { statuses, fetchedAt: payload.fetchedAt };
  }

  async getAttractionStatus(parkId: ParkId) {
    return (await this.getParkQueues(parkId)).statuses;
  }
}
