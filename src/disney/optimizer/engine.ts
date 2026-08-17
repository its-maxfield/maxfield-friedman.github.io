import { attractionById, attractionsForPark } from "../data/attractions";
import type { Attraction, AttractionPreference, DayState, PriorityTier, ScoredAction, ScoreBreakdown } from "../types";

export const weights = {
  tier: { must: 100, nice: 55, convenient: 15, "dont-care": 0 } satisfies Record<PriorityTier, number>,
  rank: [20, 15, 10, 7, 5],
  minuteSaved: 0.85,
  scarcity: { "very-high": 45, high: 25, medium: 10, low: 2 },
  activeReservation: 60,
  expiringReservation: 90,
  stale: -20,
};

const emptyBreakdown = (): ScoreBreakdown => ({ priority: 0, rank: 0, waitValue: 0, scarcity: 0, reservation: 0, geography: 0, timing: 0, closing: 0, effort: 0, stale: 0 });
const minutes = (a: string | number | Date, b: string | number | Date) => (new Date(a).getTime() - new Date(b).getTime()) / 60000;

export function dataAgeMinutes(updatedAt: string | undefined, now: Date) {
  if (!updatedAt) return Infinity;
  return Math.max(0, minutes(now, updatedAt));
}

export function freshnessLabel(updatedAt: string | undefined, now: Date) {
  const age = dataAgeMinutes(updatedAt, now);
  if (!Number.isFinite(age)) return "NO DATA";
  if (age <= 10) return `Updated ${Math.floor(age)}m ago`;
  if (age < 15) return `AGING · ${Math.floor(age)}m ago`;
  return `STALE · ${Math.floor(age)}m ago`;
}

function preferenceFor(preferences: AttractionPreference[], attractionId: string) {
  return preferences.find((preference) => preference.attractionId === attractionId);
}

function walkMinutes(currentLand: string | undefined, attraction: Attraction) {
  if (!currentLand) return 4;
  if (currentLand === attraction.land) return 3;
  const sameWest = ["Adventureland", "New Orleans Square", "Bayou Country", "Frontierland", "Galaxy's Edge"].includes(currentLand)
    && ["Adventureland", "New Orleans Square", "Bayou Country", "Frontierland", "Galaxy's Edge"].includes(attraction.land);
  const sameDca = ["Cars Land", "Avengers Campus", "Hollywood Land", "Buena Vista Street"].includes(currentLand)
    && ["Cars Land", "Avengers Campus", "Hollywood Land", "Buena Vista Street"].includes(attraction.land);
  return sameWest || sameDca ? 8 : 14;
}

function rankBonus(preference: AttractionPreference) {
  return weights.rank[preference.rankWithinTier - 1] ?? 0;
}

function closingBoost(tier: PriorityTier, day: DayState, now: Date) {
  const left = minutes(day.config.parkClose, now);
  if (tier === "must") return left < 60 ? 80 : left < 120 ? 50 : left < 180 ? 30 : 0;
  if (tier === "nice") return left < 60 ? 20 : left < 120 ? 12 : left < 180 ? 6 : 0;
  return 0;
}

function timePhase(day: DayState, now: Date) {
  const sinceOpen = minutes(now, day.config.parkOpen);
  if (sinceOpen < 120) return "rope-drop";
  if (minutes(day.config.parkClose, now) <= 360) return "evening";
  return "midday";
}

export function scarcityVelocity(day: DayState, attractionId: string) {
  const observations = day.llObservations.filter((entry) => entry.attractionId === attractionId).slice(-3);
  if (observations.length < 2) return 0;
  const first = observations[0];
  const last = observations[observations.length - 1];
  const elapsed = Math.max(1, minutes(last.observedAt, first.observedAt));
  return minutes(last.returnTime, first.returnTime) / elapsed;
}

function explanation(attraction: Attraction, preference: AttractionPreference, wait: number, walk: number, isHeld: boolean, saved: number) {
  const tier = preference.tier === "must" ? "Must Do" : preference.tier === "nice" ? "Nice To Have" : "low-effort opportunity";
  if (isHeld) return `Your return window is active or approaching. ${attraction.name} is ${walk <= 4 ? "nearby" : `${walk} minutes away`}.`;
  if (walk <= 4) return `${tier}, nearby, and a ${wait}-minute wait makes this a strong fit right now.`;
  if (saved >= 25) return `${tier} with about ${saved} minutes of potential time value despite the ${walk}-minute walk.`;
  return `${tier} and it fits the current schedule better than the remaining alternatives.`;
}

function standbyCandidate(attraction: Attraction, preference: AttractionPreference, day: DayState, now: Date): ScoredAction | undefined {
  const status = day.attractionStates[attraction.id];
  if (status?.temporarilyUnavailable || day.completedAttractionIds.includes(attraction.id) || status?.standbyMinutes === undefined) return;
  const age = dataAgeMinutes(status.lastUpdatedAt, now);
  const walk = walkMinutes(day.currentLand, attraction);
  const wait = status.standbyMinutes;
  if (preference.tier === "dont-care" && !(walk <= 3 && wait <= 5)) return;
  if (preference.tier === "convenient" && (walk > 6 || wait > 20)) return;
  const breakdown = emptyBreakdown();
  breakdown.priority = weights.tier[preference.tier];
  breakdown.rank = rankBonus(preference);
  breakdown.waitValue = Math.max(-35, 30 - wait * 0.65);
  breakdown.geography = walk <= 4 ? 18 : walk <= 8 ? 5 : -18;
  const fatigueMultiplier = day.fatigueLevel === "tired" ? 2 : day.fatigueLevel === "normal" ? 1.25 : 0.9;
  breakdown.effort = -(walk * 1.1 + wait * 0.22) * fatigueMultiplier;
  breakdown.closing = closingBoost(preference.tier, day, now);
  const phase = timePhase(day, now);
  breakdown.timing = phase === "rope-drop" && attraction.historicalDemand !== "low" ? 14 : phase === "evening" && preference.tier === "must" ? 15 : 0;
  breakdown.stale = age >= 15 ? weights.stale : age > 10 ? -8 : 0;
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const saved = Math.max(0, Math.round((attraction.historicalDemand === "very-high" ? 65 : attraction.historicalDemand === "high" ? 45 : 25) - wait));
  return {
    type: "RIDE_STANDBY",
    attractionId: attraction.id,
    score,
    title: attraction.name,
    subtitle: `Standby · ${wait}m · ${walk}m walk`,
    reason: preference.tier === "dont-care" ? "Zero-cost opportunity: directly on your route with almost no wait." : explanation(attraction, preference, wait, walk, false, saved),
    breakdown,
  };
}

function reservationCandidates(day: DayState, preferences: AttractionPreference[], now: Date): ScoredAction[] {
  return day.reservations.flatMap((reservation) => {
    if (reservation.status !== "held") return [];
    const attraction = attractionById(reservation.attractionId);
    const preference = preferenceFor(preferences, reservation.attractionId);
    if (!attraction || !preference) return [];
    const untilStart = minutes(reservation.returnStart, now);
    const untilEnd = minutes(reservation.returnEnd, now);
    if (untilStart > 45 || untilEnd < 0) return [];
    const walk = walkMinutes(day.currentLand, attraction);
    const breakdown = emptyBreakdown();
    breakdown.priority = weights.tier[preference.tier];
    breakdown.rank = rankBonus(preference);
    breakdown.reservation = untilEnd <= 30 ? weights.expiringReservation : weights.activeReservation;
    breakdown.geography = walk <= 4 ? 12 : walk > 10 ? -8 : 2;
    breakdown.effort = -walk * (day.fatigueLevel === "tired" ? 1.8 : 0.8);
    const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    return [{
      type: "USE_HELD_LIGHTNING_LANE" as const,
      attractionId: attraction.id,
      score,
      title: attraction.name,
      subtitle: untilStart > 0 ? `Window opens in ${Math.ceil(untilStart)}m` : `Window ends in ${Math.max(0, Math.floor(untilEnd))}m`,
      reason: explanation(attraction, preference, 0, walk, true, 0),
      breakdown,
    }];
  });
}

function scheduledCandidates(day: DayState, now: Date): ScoredAction[] {
  return day.scheduledPlans.flatMap((plan) => {
    const untilStart = minutes(plan.start, now);
    const untilEnd = minutes(plan.end, now);
    if (untilStart > 30 || untilEnd < 0) return [];
    const breakdown = emptyBreakdown();
    breakdown.timing = untilStart <= 10 ? 80 : 45;
    return [{ type: plan.type, planId: plan.id, score: breakdown.timing, title: plan.title, subtitle: untilStart > 0 ? `Starts in ${Math.ceil(untilStart)}m` : "Happening now", reason: "This planned activity fits the schedule now.", breakdown }];
  });
}

export function recommendNowOptions(day: DayState, preferences: AttractionPreference[], now: Date): ScoredAction[] {
  const candidates = [
    ...reservationCandidates(day, preferences, now),
    ...scheduledCandidates(day, now),
    ...attractionsForPark(day.config.parkId).flatMap((attraction) => {
      const preference = preferenceFor(preferences, attraction.id);
      if (!preference) return [];
      const candidate = standbyCandidate(attraction, preference, day, now);
      return candidate ? [candidate] : [];
    }),
  ].sort((a, b) => b.score - a.score || (a.attractionId ?? a.planId ?? "").localeCompare(b.attractionId ?? b.planId ?? ""));
  return candidates;
}

export function recommendNow(day: DayState, preferences: AttractionPreference[], now: Date): ScoredAction {
  return recommendNowOptions(day, preferences, now)[0] ?? { type: "WAIT", score: 0, title: "Refresh priority waits", subtitle: "No reliable action yet", reason: "Refresh live queues or add a current wait so the optimizer can compare your priority rides.", breakdown: emptyBreakdown() };
}

export function recommendBookNext(day: DayState, preferences: AttractionPreference[], now: Date): ScoredAction | undefined {
  if (day.nextLightningLaneEligibleAt && minutes(day.nextLightningLaneEligibleAt, now) > 0) return;
  const used = new Set(day.reservations.filter((reservation) => reservation.status !== "cancelled").map((reservation) => reservation.attractionId));
  return attractionsForPark(day.config.parkId)
    .filter((attraction) => attraction.lightningLane && !attraction.singlePass && !used.has(attraction.id) && !day.completedAttractionIds.includes(attraction.id))
    .flatMap((attraction) => {
      const preference = preferenceFor(preferences, attraction.id);
      const status = day.attractionStates[attraction.id];
      if (!preference || preference.tier === "dont-care" || status?.temporarilyUnavailable) return [];
      const standby = status?.standbyMinutes;
      const saved = standby === undefined ? 0 : Math.max(0, standby - attraction.expectedLlQueueMinutes);
      const velocity = scarcityVelocity(day, attraction.id);
      const breakdown = emptyBreakdown();
      breakdown.priority = weights.tier[preference.tier];
      breakdown.rank = rankBonus(preference);
      breakdown.waitValue = saved * weights.minuteSaved;
      breakdown.scarcity = velocity >= 2 ? weights.scarcity[attraction.historicalDemand] + 20 : velocity >= 1 ? weights.scarcity[attraction.historicalDemand] : weights.scarcity[attraction.historicalDemand] * 0.45;
      breakdown.closing = closingBoost(preference.tier, day, now) * 0.5;
      if (status && dataAgeMinutes(status.lastUpdatedAt, now) >= 15) breakdown.stale = weights.stale;
      const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
      const trend = velocity >= 2 ? "worsening quickly" : velocity >= 1 ? "moving later" : "historically scarce";
      return [{
        type: "BOOK_LIGHTNING_LANE" as const,
        attractionId: attraction.id,
        score,
        title: attraction.name,
        subtitle: status?.lightningLaneReturnStart ? `Current return · ${formatTime(status.lightningLaneReturnStart)}` : "Check the official Disneyland app",
        reason: saved > 0 ? `Could save about ${Math.round(saved)} minutes; availability is ${trend}.` : `A high-value ${preference.tier === "must" ? "Must Do" : "priority"} selection; confirm availability in the official app.`,
        breakdown,
        estimatedMinutesSaved: Math.round(saved),
      }];
    })
    .sort((a, b) => b.score - a.score || (a.attractionId ?? "").localeCompare(b.attractionId ?? ""))[0];
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function estimateRemainingMustDoMinutes(day: DayState, preferences: AttractionPreference[]) {
  return preferences.filter((preference) => preference.tier === "must" && !day.completedAttractionIds.includes(preference.attractionId)).reduce((total, preference) => {
    const attraction = attractionById(preference.attractionId);
    if (!attraction) return total;
    const wait = day.attractionStates[attraction.id]?.standbyMinutes ?? (attraction.historicalDemand === "very-high" ? 60 : 35);
    return total + wait + attraction.durationMinutes + 6;
  }, 0);
}
