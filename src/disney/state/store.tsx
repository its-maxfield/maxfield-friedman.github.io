"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { attractionsForPark } from "../data/attractions";
import { LiveDataProvider, MockDataProvider } from "../providers/providers";
import type { AppState, AttractionPreference, AttractionStatus, FatigueLevel, LightningLaneReservation, ParkId, PriorityTier, ScheduledPlan } from "../types";

const STORAGE_KEY = "park-day-optimizer:v1";
const SIM_STORAGE_KEY = "park-day-optimizer:simulation:v1";

const configs = {
  disneyland: {
    parkId: "disneyland" as const,
    date: "2026-08-18",
    label: "Disneyland Park",
    shortLabel: "Disneyland",
    parkOpen: "2026-08-18T08:00:00-07:00",
    parkClose: "2026-08-19T00:00:00-07:00",
    hoursConfirmed: false,
  },
  "california-adventure": {
    parkId: "california-adventure" as const,
    date: "2026-08-19",
    label: "Disney California Adventure",
    shortLabel: "California Adventure",
    parkOpen: "2026-08-19T08:00:00-07:00",
    parkClose: "2026-08-19T22:00:00-07:00",
    hoursConfirmed: false,
  },
};

function emptyDay(parkId: ParkId) {
  return {
    config: configs[parkId],
    currentLand: undefined,
    fatigueLevel: "normal" as const,
    nextLightningLaneEligibleAt: undefined,
    reservations: [],
    completedAttractionIds: [],
    attractionStates: {},
    llObservations: [],
    scheduledPlans: [],
    history: [],
    simulatedTime: undefined,
    pinnedAttractionIds: [],
    lastLiveRefreshAt: undefined,
  };
}

export function createInitialState(simulation = false): AppState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    version: 2,
    activeParkId: today === "2026-08-19" ? "california-adventure" : "disneyland",
    setupComplete: { disneyland: false, "california-adventure": false },
    preferences: { disneyland: [], "california-adventure": [] },
    days: { disneyland: emptyDay("disneyland"), "california-adventure": emptyDay("california-adventure") },
    simulation,
  };
}

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "SET_ACTIVE_PARK"; parkId: ParkId }
  | { type: "SET_TIER"; parkId: ParkId; attractionId: string; tier: PriorityTier }
  | { type: "MOVE_PREFERENCE"; parkId: ParkId; attractionId: string; direction: -1 | 1 }
  | { type: "SET_SETUP_COMPLETE"; parkId: ParkId; complete: boolean }
  | { type: "SET_LOCATION"; parkId: ParkId; land: string }
  | { type: "SET_FATIGUE"; parkId: ParkId; level: FatigueLevel }
  | { type: "SET_HOURS"; parkId: ParkId; parkOpen: string; parkClose: string }
  | { type: "UPDATE_STATUS"; parkId: ParkId; status: AttractionStatus; label?: string }
  | { type: "COMPLETE_ATTRACTION"; parkId: ParkId; attractionId: string; at: string }
  | { type: "BOOK_RESERVATION"; parkId: ParkId; reservation: LightningLaneReservation }
  | { type: "SET_RESERVATION_STATUS"; parkId: ParkId; id: string; status: "redeemed" | "cancelled" | "expired"; at: string }
  | { type: "MODIFY_RESERVATION"; parkId: ParkId; id: string; returnStart: string; returnEnd: string; at: string }
  | { type: "CORRECT_TIMER"; parkId: ParkId; at?: string }
  | { type: "ADD_PLAN"; parkId: ParkId; plan: ScheduledPlan }
  | { type: "REMOVE_PLAN"; parkId: ParkId; id: string }
  | { type: "SET_SIM_TIME"; parkId: ParkId; at: string }
  | { type: "LOAD_MOCK"; parkId: ParkId; statuses: AttractionStatus[] }
  | { type: "LOAD_LIVE"; parkId: ParkId; statuses: AttractionStatus[]; fetchedAt: string }
  | { type: "TOGGLE_PIN"; parkId: ParkId; attractionId: string }
  | { type: "RESET_DAY"; parkId: ParkId };

const historyEntry = (label: string, at: string, estimatedMinutesSaved?: number) => ({ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, at, label, estimatedMinutesSaved });

function reorder(preferences: AttractionPreference[], attractionId: string, direction: -1 | 1) {
  const current = preferences.find((preference) => preference.attractionId === attractionId);
  if (!current) return preferences;
  const tier = preferences.filter((preference) => preference.tier === current.tier).sort((a, b) => a.rankWithinTier - b.rankWithinTier);
  const index = tier.findIndex((preference) => preference.attractionId === attractionId);
  const swap = tier[index + direction];
  if (!swap) return preferences;
  return preferences.map((preference) => preference.attractionId === current.attractionId
    ? { ...preference, rankWithinTier: swap.rankWithinTier }
    : preference.attractionId === swap.attractionId ? { ...preference, rankWithinTier: current.rankWithinTier } : preference);
}

export function disneyReducer(state: AppState, action: Action): AppState {
  if (action.type === "HYDRATE") return action.state;
  if (action.type === "SET_ACTIVE_PARK") return { ...state, activeParkId: action.parkId };
  if (action.type === "SET_TIER") {
    const others = state.preferences[action.parkId].filter((preference) => preference.attractionId !== action.attractionId);
    const rankWithinTier = others.filter((preference) => preference.tier === action.tier).length + 1;
    return { ...state, preferences: { ...state.preferences, [action.parkId]: [...others, { attractionId: action.attractionId, tier: action.tier, rankWithinTier }] } };
  }
  if (action.type === "MOVE_PREFERENCE") return { ...state, preferences: { ...state.preferences, [action.parkId]: reorder(state.preferences[action.parkId], action.attractionId, action.direction) } };
  if (action.type === "SET_SETUP_COMPLETE") return { ...state, setupComplete: { ...state.setupComplete, [action.parkId]: action.complete } };
  if (action.type === "RESET_DAY") return { ...state, days: { ...state.days, [action.parkId]: emptyDay(action.parkId) }, setupComplete: { ...state.setupComplete, [action.parkId]: false }, preferences: { ...state.preferences, [action.parkId]: [] } };

  const day = state.days[action.parkId];
  let next = day;
  if (action.type === "SET_LOCATION") next = { ...day, currentLand: action.land };
  if (action.type === "SET_FATIGUE") next = { ...day, fatigueLevel: action.level };
  if (action.type === "SET_HOURS") next = { ...day, config: { ...day.config, parkOpen: action.parkOpen, parkClose: action.parkClose, hoursConfirmed: true }, history: [...day.history, historyEntry("Confirmed park hours", new Date().toISOString())].slice(-500) };
  if (action.type === "UPDATE_STATUS") {
    const previous = day.attractionStates[action.status.attractionId] ?? { attractionId: action.status.attractionId };
    const status = { ...previous, ...action.status };
    const observations = status.lightningLaneReturnStart ? [...day.llObservations, { attractionId: status.attractionId, observedAt: status.lastUpdatedAt ?? new Date().toISOString(), returnTime: status.lightningLaneReturnStart }].slice(-150) : day.llObservations;
    next = { ...day, attractionStates: { ...day.attractionStates, [status.attractionId]: status }, llObservations: observations, history: action.label ? [...day.history, historyEntry(action.label, status.lastUpdatedAt ?? new Date().toISOString())].slice(-500) : day.history };
  }
  if (action.type === "COMPLETE_ATTRACTION") {
    const attraction = attractionsForPark(action.parkId).find((item) => item.id === action.attractionId);
    if (!day.completedAttractionIds.includes(action.attractionId)) next = { ...day, completedAttractionIds: [...day.completedAttractionIds, action.attractionId], currentLand: attraction?.land ?? day.currentLand, history: [...day.history, historyEntry(`Completed ${attraction?.name ?? action.attractionId}`, action.at)].slice(-500) };
  }
  if (action.type === "BOOK_RESERVATION") {
    const attraction = attractionsForPark(action.parkId).find((item) => item.id === action.reservation.attractionId);
    next = { ...day, reservations: [...day.reservations, action.reservation], nextLightningLaneEligibleAt: new Date(new Date(action.reservation.bookedAt).getTime() + 120 * 60000).toISOString(), history: [...day.history, historyEntry(`Booked ${attraction?.name ?? action.reservation.attractionId}`, action.reservation.bookedAt)].slice(-500) };
  }
  if (action.type === "SET_RESERVATION_STATUS") {
    const reservation = day.reservations.find((item) => item.id === action.id);
    const attraction = reservation ? attractionsForPark(action.parkId).find((item) => item.id === reservation.attractionId) : undefined;
    const saved = action.status === "redeemed" && attraction ? Math.max(0, (day.attractionStates[attraction.id]?.standbyMinutes ?? 0) - attraction.expectedLlQueueMinutes) : undefined;
    const verb = action.status === "redeemed" ? "Redeemed" : action.status === "cancelled" ? "Cancelled" : "Expired";
    next = { ...day, reservations: day.reservations.map((item) => item.id === action.id ? { ...item, status: action.status, redeemedAt: action.status === "redeemed" ? action.at : item.redeemedAt } : item), nextLightningLaneEligibleAt: action.status === "redeemed" ? action.at : day.nextLightningLaneEligibleAt, history: [...day.history, historyEntry(`${verb} ${attraction?.name ?? "Lightning Lane"}`, action.at, saved)].slice(-500) };
  }
  if (action.type === "MODIFY_RESERVATION") next = { ...day, reservations: day.reservations.map((item) => item.id === action.id ? { ...item, returnStart: action.returnStart, returnEnd: action.returnEnd, modifiedAt: action.at } : item), history: [...day.history, historyEntry("Modified Lightning Lane return window", action.at)].slice(-500) };
  if (action.type === "CORRECT_TIMER") next = { ...day, nextLightningLaneEligibleAt: action.at, history: [...day.history, historyEntry(action.at ? "Corrected Lightning Lane timer" : "Set Lightning Lane to book now", new Date().toISOString())].slice(-500) };
  if (action.type === "ADD_PLAN") next = { ...day, scheduledPlans: [...day.scheduledPlans, action.plan], history: [...day.history, historyEntry(`Added ${action.plan.type === "EAT" ? "meal or rest" : "show"}: ${action.plan.title}`, new Date().toISOString())].slice(-500) };
  if (action.type === "REMOVE_PLAN") next = { ...day, scheduledPlans: day.scheduledPlans.filter((plan) => plan.id !== action.id) };
  if (action.type === "SET_SIM_TIME") next = { ...day, simulatedTime: action.at };
  if (action.type === "LOAD_MOCK") next = { ...day, attractionStates: Object.fromEntries(action.statuses.map((status) => [status.attractionId, status])), llObservations: action.statuses.flatMap((status) => status.lightningLaneReturnStart ? [{ attractionId: status.attractionId, observedAt: status.lastUpdatedAt ?? new Date().toISOString(), returnTime: status.lightningLaneReturnStart }] : []) };
  if (action.type === "LOAD_LIVE") {
    const attractionStates = { ...day.attractionStates };
    const newObservations = action.statuses.flatMap((status) => status.lightningLaneReturnStart
      ? [{ attractionId: status.attractionId, observedAt: status.lastUpdatedAt ?? action.fetchedAt, returnTime: status.lightningLaneReturnStart }]
      : []);
    for (const status of action.statuses) attractionStates[status.attractionId] = { ...attractionStates[status.attractionId], ...status };
    next = { ...day, attractionStates, llObservations: [...day.llObservations, ...newObservations].slice(-150), lastLiveRefreshAt: action.fetchedAt };
  }
  if (action.type === "TOGGLE_PIN") next = { ...day, pinnedAttractionIds: day.pinnedAttractionIds.includes(action.attractionId) ? day.pinnedAttractionIds.filter((id) => id !== action.attractionId) : [...day.pinnedAttractionIds, action.attractionId] };
  return { ...state, days: { ...state.days, [action.parkId]: next } };
}

type StoreValue = { state: AppState; dispatch: React.Dispatch<Action>; hydrated: boolean; loadMock: (parkId: ParkId, now: Date) => Promise<void>; refreshLive: (parkId: ParkId) => Promise<number> };
const StoreContext = createContext<StoreValue | undefined>(undefined);

function safeParse(raw: string | null, simulation: boolean): AppState | undefined {
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Omit<AppState, "version"> & { version: number };
    if (parsed.version !== 1 && parsed.version !== 2) return;
    const migrateDay = (day: AppState["days"][ParkId]) => ({ ...day, pinnedAttractionIds: day.pinnedAttractionIds ?? [], lastLiveRefreshAt: day.lastLiveRefreshAt });
    return { ...parsed, version: 2, simulation, days: { disneyland: migrateDay(parsed.days.disneyland), "california-adventure": migrateDay(parsed.days["california-adventure"]) } };
  } catch { return; }
}

export function DisneyStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(disneyReducer, false, () => createInitialState(false));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const simulation = new URLSearchParams(window.location.search).get("simulate") === "true";
    const stored = safeParse(localStorage.getItem(simulation ? SIM_STORAGE_KEY : STORAGE_KEY), simulation);
    queueMicrotask(() => {
      dispatch({ type: "HYDRATE", state: stored ?? createInitialState(simulation) });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(state.simulation ? SIM_STORAGE_KEY : STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const loadMock = async (parkId: ParkId, now: Date) => {
    const statuses = await new MockDataProvider(now).getAttractionStatus(parkId);
    dispatch({ type: "LOAD_MOCK", parkId, statuses });
  };
  const refreshLive = async (parkId: ParkId) => {
    const provider = new LiveDataProvider();
    const result = await provider.getParkQueues(parkId);
    dispatch({ type: "LOAD_LIVE", parkId, statuses: result.statuses, fetchedAt: result.fetchedAt });
    return result.statuses.length;
  };
  const value = useMemo(() => ({ state, dispatch, hydrated, loadMock, refreshLive }), [state, hydrated]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useDisneyStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useDisneyStore must be used inside DisneyStoreProvider");
  return value;
}
