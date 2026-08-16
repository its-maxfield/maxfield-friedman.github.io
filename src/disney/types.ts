export type ParkId = "disneyland" | "california-adventure";
export type PriorityTier = "must" | "nice" | "convenient" | "dont-care";
export type FatigueLevel = "good" | "normal" | "tired";
export type DataSource = "manual" | "mock";
export type ReservationStatus = "held" | "redeemed" | "expired" | "cancelled";
export type ActionType =
  | "BOOK_LIGHTNING_LANE"
  | "USE_HELD_LIGHTNING_LANE"
  | "RIDE_STANDBY"
  | "WALK_TO_LAND"
  | "EAT"
  | "WAIT"
  | "SHOW";

export type Attraction = {
  id: string;
  parkId: ParkId;
  name: string;
  land: string;
  latitude: number;
  longitude: number;
  lightningLane: boolean;
  singlePass?: boolean;
  historicalDemand: "very-high" | "high" | "medium" | "low";
  expectedLlQueueMinutes: number;
  durationMinutes: number;
};

export type AttractionPreference = {
  attractionId: string;
  tier: PriorityTier;
  rankWithinTier: number;
};

export type AttractionStatus = {
  attractionId: string;
  standbyMinutes?: number;
  lightningLaneReturnStart?: string;
  lightningLaneReturnEnd?: string;
  temporarilyUnavailable?: boolean;
  lastUpdatedAt?: string;
  source?: DataSource;
};

export type LightningLaneReservation = {
  id: string;
  attractionId: string;
  bookedAt: string;
  returnStart: string;
  returnEnd: string;
  redeemedAt?: string;
  modifiedAt?: string;
  status: ReservationStatus;
};

export type LLObservation = {
  attractionId: string;
  observedAt: string;
  returnTime: string;
};

export type ScheduledPlan = {
  id: string;
  type: "EAT" | "SHOW";
  title: string;
  land?: string;
  start: string;
  end: string;
};

export type HistoryEntry = {
  id: string;
  at: string;
  label: string;
  estimatedMinutesSaved?: number;
};

export type ParkDayConfig = {
  parkId: ParkId;
  date: string;
  label: string;
  shortLabel: string;
  parkOpen: string;
  parkClose: string;
  hoursConfirmed: boolean;
};

export type DayState = {
  config: ParkDayConfig;
  currentLand?: string;
  fatigueLevel: FatigueLevel;
  nextLightningLaneEligibleAt?: string;
  reservations: LightningLaneReservation[];
  completedAttractionIds: string[];
  attractionStates: Record<string, AttractionStatus>;
  llObservations: LLObservation[];
  scheduledPlans: ScheduledPlan[];
  history: HistoryEntry[];
  simulatedTime?: string;
};

export type AppState = {
  version: 1;
  activeParkId: ParkId;
  setupComplete: Record<ParkId, boolean>;
  preferences: Record<ParkId, AttractionPreference[]>;
  days: Record<ParkId, DayState>;
  simulation: boolean;
};

export type ScoreBreakdown = {
  priority: number;
  rank: number;
  waitValue: number;
  scarcity: number;
  reservation: number;
  geography: number;
  timing: number;
  closing: number;
  effort: number;
  stale: number;
};

export type ScoredAction = {
  type: ActionType;
  attractionId?: string;
  planId?: string;
  score: number;
  title: string;
  subtitle: string;
  reason: string;
  breakdown: ScoreBreakdown;
  estimatedMinutesSaved?: number;
};

export interface DisneylandDataProvider {
  getAttractionStatus(parkId: ParkId): Promise<AttractionStatus[]>;
}
