"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BatteryMedium, Check, Clock3, CloudOff, History, Map as MapIcon, MapPin, Minus, Plus, RefreshCw, Settings2, Sparkles, Ticket, Wifi, X } from "lucide-react";
import AccessGate from "./AccessGate";
import { attractionById, attractionsForPark, landsForPark } from "../data/attractions";
import { dataAgeMinutes, estimateRemainingMustDoMinutes, formatTime, freshnessLabel, recommendBookNext, recommendNow } from "../optimizer/engine";
import { DisneyStoreProvider, useDisneyStore } from "../state/store";
import type { Attraction, FatigueLevel, ParkId, PriorityTier, ScoredAction } from "../types";

const tierMeta: Record<PriorityTier, { label: string; stars: string; color: string }> = {
  must: { label: "MUST DO", stars: "★★★★★", color: "border-amber-300/50 bg-amber-300/10 text-amber-100" },
  nice: { label: "NICE TO HAVE", stars: "★★★★", color: "border-sky-300/40 bg-sky-300/10 text-sky-100" },
  convenient: { label: "DOWN IF CONVENIENT", stars: "★★", color: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" },
  "dont-care": { label: "DON'T CARE", stars: "—", color: "border-white/10 bg-white/5 text-white/55" },
};

const button = "min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold transition active:scale-[.98] disabled:opacity-35";
const input = "min-h-12 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-base outline-none focus:border-emerald-300";
const toLocalInput = (value: string | Date) => {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => new Date(value).toISOString();
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return online;
}

function RegisterPwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/park-day-8x4m/sw.js", { scope: "/park-day-8x4m/" }).catch(() => undefined);
  }, []);
  return null;
}

function SetupScreen({ parkId, onDone }: { parkId: ParkId; onDone: () => void }) {
  const { state, dispatch } = useDisneyStore();
  const rides = attractionsForPark(parkId);
  const preferences = state.preferences[parkId];
  const unclassified = rides.find((ride) => !preferences.some((preference) => preference.attractionId === ride.id));
  const [ordering, setOrdering] = useState(false);
  if (unclassified && !ordering) return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Trip setup · {state.days[parkId].config.shortLabel}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-300" style={{ width: `${(preferences.length / rides.length) * 100}%` }} /></div>
      <p className="mt-2 text-xs text-white/50">{preferences.length} of {rides.length} classified</p>
      <section className="my-auto py-10 text-center">
        <p className="text-sm font-bold text-white/50">{unclassified.land}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight">{unclassified.name}</h1>
        {unclassified.singlePass && <p className="mt-3 text-xs font-bold text-amber-200">Single Pass attraction · standby only in this tool</p>}
        <div className="mt-8 grid gap-3">
          {(Object.keys(tierMeta) as PriorityTier[]).map((tier) => <button key={tier} onClick={() => dispatch({ type: "SET_TIER", parkId, attractionId: unclassified.id, tier })} className={`min-h-14 rounded-2xl border px-4 text-left font-black ${tierMeta[tier].color}`}><span className="mr-2">{tierMeta[tier].stars}</span>{tierMeta[tier].label}</button>)}
        </div>
      </section>
      <button onClick={() => rides.filter((ride) => !preferences.some((preference) => preference.attractionId === ride.id)).forEach((ride) => dispatch({ type: "SET_TIER", parkId, attractionId: ride.id, tier: "dont-care" }))} className={`${button} w-full text-white/60`}>Mark remaining Don&apos;t Care</button>
    </div>
  );

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-8 pt-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Order your priorities</p>
      <h1 className="mt-2 text-3xl font-black">What matters most?</h1>
      <p className="mt-2 text-sm leading-6 text-white/55">The top few rides in each tier get a modest bonus. You can change this anytime.</p>
      <div className="mt-6 space-y-6">
        {(Object.keys(tierMeta) as PriorityTier[]).map((tier) => {
          const items = preferences.filter((preference) => preference.tier === tier).sort((a, b) => a.rankWithinTier - b.rankWithinTier);
          return <section key={tier}><h2 className="text-xs font-black tracking-wider text-white/55">{tierMeta[tier].stars} {tierMeta[tier].label}</h2><div className="mt-2 space-y-2">{items.map((preference, index) => <div key={preference.attractionId} className="rounded-xl border border-white/10 bg-white/5 p-2"><div className="flex items-center gap-2"><span className="w-6 text-center text-sm font-black text-white/45">{index + 1}</span><span className="min-w-0 flex-1 text-sm font-bold">{attractionById(preference.attractionId)?.name}</span><button aria-label="Move up" disabled={index === 0} onClick={() => dispatch({ type: "MOVE_PREFERENCE", parkId, attractionId: preference.attractionId, direction: -1 })} className="grid size-10 place-items-center rounded-lg bg-white/5 disabled:opacity-20"><ArrowUp size={16} /></button><button aria-label="Move down" disabled={index === items.length - 1} onClick={() => dispatch({ type: "MOVE_PREFERENCE", parkId, attractionId: preference.attractionId, direction: 1 })} className="grid size-10 place-items-center rounded-lg bg-white/5 disabled:opacity-20"><ArrowDown size={16} /></button></div><select aria-label={`Priority for ${attractionById(preference.attractionId)?.name}`} value={preference.tier} onChange={(event) => dispatch({ type: "SET_TIER", parkId, attractionId: preference.attractionId, tier: event.target.value as PriorityTier })} className="mt-2 min-h-10 w-full rounded-lg border border-white/10 bg-[#10221d] px-2 text-xs font-bold">{(Object.keys(tierMeta) as PriorityTier[]).map((option) => <option key={option} value={option}>{tierMeta[option].label}</option>)}</select></div>)}</div></section>;
        })}
      </div>
      <button onClick={() => { dispatch({ type: "SET_SETUP_COMPLETE", parkId, complete: true }); onDone(); }} className="mt-8 min-h-14 w-full rounded-2xl bg-emerald-300 font-black text-emerald-950">Start optimizing</button>
      <button onClick={() => setOrdering(false)} className={`${button} mt-3 w-full`}>Back to classification</button>
    </div>
  );
}

function ActionCard({ action, now, onComplete }: { action: ScoredAction; now: Date; onComplete: (id: string) => void }) {
  const status = action.attractionId ? undefined : undefined;
  return (
    <section className="rounded-[28px] border border-amber-300/40 bg-gradient-to-br from-amber-200 to-orange-300 p-5 text-[#25180b] shadow-2xl shadow-amber-950/25">
      <p className="text-xs font-black uppercase tracking-[0.24em]">{action.type === "USE_HELD_LIGHTNING_LANE" ? "Use this lane" : action.type === "EAT" ? "Take this break" : action.type === "SHOW" ? "Head to this plan" : action.type === "WAIT" ? "Do this now" : "Do this now"}</p>
      <h2 className="mt-4 text-3xl font-black leading-none">{action.title}</h2>
      <p className="mt-3 text-sm font-black">{action.subtitle}</p>
      <p className="mt-5 border-t border-black/15 pt-4 text-sm leading-5"><span className="font-black">Why: </span>{action.reason}</p>
      {action.attractionId && <button onClick={() => onComplete(action.attractionId!)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25180b] px-4 font-black text-amber-100"><Check size={18} /> Mark completed</button>}
      <span className="sr-only">Recommendation calculated at {now.toISOString()}. {status}</span>
    </section>
  );
}

function BookingModal({ parkId, now, onClose, reservationId }: { parkId: ParkId; now: Date; onClose: () => void; reservationId?: string }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const existing = day.reservations.find((item) => item.id === reservationId);
  const eligible = attractionsForPark(parkId).filter((ride) => ride.lightningLane && !ride.singlePass);
  const [attractionId, setAttractionId] = useState(existing?.attractionId ?? eligible[0]?.id ?? "");
  const [start, setStart] = useState(toLocalInput(existing?.returnStart ?? new Date(now.getTime() + 60 * 60000)));
  const [end, setEnd] = useState(toLocalInput(existing?.returnEnd ?? new Date(now.getTime() + 120 * 60000)));
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (existing) dispatch({ type: "MODIFY_RESERVATION", parkId, id: existing.id, returnStart: fromLocalInput(start), returnEnd: fromLocalInput(end), at: now.toISOString() });
    else dispatch({ type: "BOOK_RESERVATION", parkId, reservation: { id: uid(), attractionId, bookedAt: now.toISOString(), returnStart: fromLocalInput(start), returnEnd: fromLocalInput(end), status: "held" } });
    onClose();
  }
  return <div className="fixed inset-0 z-[80] grid items-end bg-black/70 p-3 sm:items-center"><form onSubmit={save} className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#10221d] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">{existing ? "Modify return window" : "Record Lightning Lane"}</h2><button type="button" aria-label="Close" onClick={onClose} className="grid size-11 place-items-center rounded-xl bg-white/5"><X /></button></div>{!existing && <><label className="mt-5 block text-xs font-bold uppercase tracking-wider text-white/50">Attraction</label><select className={`${input} mt-2`} value={attractionId} onChange={(event) => setAttractionId(event.target.value)}>{eligible.map((ride) => <option className="bg-[#10221d]" key={ride.id} value={ride.id}>{ride.name}</option>)}</select></>}<label className="mt-4 block text-xs font-bold uppercase tracking-wider text-white/50">Return starts</label><input required type="datetime-local" className={`${input} mt-2`} value={start} onChange={(event) => setStart(event.target.value)} /><label className="mt-4 block text-xs font-bold uppercase tracking-wider text-white/50">Return ends</label><input required type="datetime-local" className={`${input} mt-2`} value={end} onChange={(event) => setEnd(event.target.value)} /><button className="mt-5 min-h-12 w-full rounded-xl bg-emerald-300 font-black text-emerald-950">{existing ? "Save modification" : "Booked"}</button></form></div>;
}

function TimerCard({ parkId, now }: { parkId: ParkId; now: Date }) {
  const { state, dispatch } = useDisneyStore();
  const eligibleAt = state.days[parkId].nextLightningLaneEligibleAt;
  const seconds = eligibleAt ? Math.max(0, Math.ceil((new Date(eligibleAt).getTime() - now.getTime()) / 1000)) : 0;
  const label = seconds <= 0 ? "BOOK NOW" : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <section className="rounded-2xl border border-sky-300/25 bg-sky-300/10 p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Next Lightning Lane</p><p className="mt-1 text-2xl font-black">{label}</p></div><Clock3 className="text-sky-200" /></div><div className="mt-3 flex gap-2"><button onClick={() => dispatch({ type: "CORRECT_TIMER", parkId })} className={`${button} flex-1`}>Book now</button><button onClick={() => { const raw = prompt("Correct eligible time (example: 2:30 PM)"); if (!raw) return; const parsed = new Date(`${state.days[parkId].config.date} ${raw}`); if (!Number.isNaN(parsed.getTime())) dispatch({ type: "CORRECT_TIMER", parkId, at: parsed.toISOString() }); }} className={`${button} flex-1`}>Correct timer</button></div></section>;
}

function Progress({ parkId }: { parkId: ParkId }) {
  const { state } = useDisneyStore(); const day = state.days[parkId]; const prefs = state.preferences[parkId];
  const count = (tier: PriorityTier) => ({ total: prefs.filter((item) => item.tier === tier).length, done: prefs.filter((item) => item.tier === tier && day.completedAttractionIds.includes(item.attractionId)).length });
  const must = count("must"), nice = count("nice"), convenient = count("convenient");
  const saved = day.history.reduce((sum, item) => sum + (item.estimatedMinutesSaved ?? 0), 0);
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Day progress</p><div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-sm"><p><span className="block text-white/45">Must Do</span><strong className="text-lg">{must.done} / {must.total}</strong></p><p><span className="block text-white/45">Nice To Have</span><strong className="text-lg">{nice.done} / {nice.total}</strong></p><p><span className="block text-white/45">Convenient</span><strong className="text-lg">{convenient.done} done</strong></p><p><span className="block text-white/45">Standby avoided</span><strong className="text-lg">~{Math.floor(saved / 60)}h {saved % 60}m</strong></p></div></section>;
}

function UpdateView({ parkId, now }: { parkId: ParkId; now: Date }) {
  const { state, dispatch } = useDisneyStore(); const day = state.days[parkId];
  const [filter, setFilter] = useState("");
  const rides = attractionsForPark(parkId).filter((ride) => ride.name.toLowerCase().includes(filter.toLowerCase()));
  const waitChoices = [5, 10, 15, 20, 30, 45, 60];
  function updateWait(ride: Attraction, standbyMinutes: number) { dispatch({ type: "UPDATE_STATUS", parkId, status: { attractionId: ride.id, standbyMinutes, lastUpdatedAt: now.toISOString(), source: state.simulation ? "mock" : "manual" }, label: `Updated ${ride.name} wait → ${standbyMinutes}m` }); }
  function updateLl(ride: Attraction, offset: number | Date) { const start = offset instanceof Date ? offset : new Date(now.getTime() + offset * 60000); dispatch({ type: "UPDATE_STATUS", parkId, status: { attractionId: ride.id, lightningLaneReturnStart: start.toISOString(), lightningLaneReturnEnd: new Date(start.getTime() + 3600000).toISOString(), lastUpdatedAt: now.toISOString(), source: state.simulation ? "mock" : "manual" }, label: `Updated ${ride.name} LL return → ${formatTime(start)}` }); }
  return <div className="space-y-3"><div><h2 className="text-2xl font-black">Fast updates</h2><p className="mt-1 text-sm text-white/50">Every tap is timestamped. Manual data is never labeled live.</p></div><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find an attraction" className={input} />{rides.map((ride) => { const status = day.attractionStates[ride.id]; return <section key={ride.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{ride.name}</h3><p className={`mt-1 text-[11px] font-bold ${dataAgeMinutes(status?.lastUpdatedAt, now) >= 15 ? "text-rose-300" : "text-white/40"}`}>{freshnessLabel(status?.lastUpdatedAt, now)}</p></div><button onClick={() => dispatch({ type: "UPDATE_STATUS", parkId, status: { attractionId: ride.id, temporarilyUnavailable: !status?.temporarilyUnavailable, lastUpdatedAt: now.toISOString(), source: state.simulation ? "mock" : "manual" } })} className={`min-h-10 rounded-lg px-2 text-[10px] font-black ${status?.temporarilyUnavailable ? "bg-rose-300 text-rose-950" : "bg-white/5 text-white/45"}`}>{status?.temporarilyUnavailable ? "UNAVAILABLE" : "OPERATING?"}</button></div><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-white/40">Standby {status?.standbyMinutes !== undefined && `· ${status.standbyMinutes}m`}</p><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{waitChoices.map((wait) => <button key={wait} onClick={() => updateWait(ride, wait)} className="min-h-11 min-w-11 rounded-xl bg-white/10 text-sm font-black">{wait}</button>)}<button onClick={() => { const value = prompt("Standby minutes"); if (value && !Number.isNaN(Number(value))) updateWait(ride, Number(value)); }} className="min-h-11 min-w-11 rounded-xl bg-white/10 font-black">+</button></div>{ride.lightningLane && <><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-white/40">LL return {status?.lightningLaneReturnStart && `· ${formatTime(status.lightningLaneReturnStart)}`}</p><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{[[0, "NOW"], [15, "+15"], [30, "+30"], [60, "+60"]].map(([offset, label]) => <button key={label} onClick={() => updateLl(ride, Number(offset))} className="min-h-11 min-w-14 rounded-xl bg-emerald-300/10 px-2 text-xs font-black text-emerald-200">{label}</button>)}</div></>}</section>; })}</div>;
}

function PlansView({ parkId, now, onBook }: { parkId: ParkId; now: Date; onBook: (id?: string) => void }) {
  const { state, dispatch } = useDisneyStore(); const day = state.days[parkId];
  const held = day.reservations.filter((reservation) => reservation.status === "held");
  function addPlan(type: "EAT" | "SHOW") { const title = prompt(type === "EAT" ? "Meal or rest label" : "Show name"); if (!title) return; const start = new Date(now.getTime() + 30 * 60000); dispatch({ type: "ADD_PLAN", parkId, plan: { id: uid(), type, title, start: start.toISOString(), end: new Date(start.getTime() + 60 * 60000).toISOString(), land: day.currentLand } }); }
  return <div><div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">Plans & history</h2><p className="mt-1 text-sm text-white/50">Reservations held: {held.length}</p></div><button onClick={() => onBook()} className="min-h-11 rounded-xl bg-emerald-300 px-3 text-sm font-black text-emerald-950">Booked</button></div><div className="mt-5 space-y-3">{day.reservations.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/45">No Lightning Lanes recorded yet.</p>}{day.reservations.slice().reverse().map((reservation) => { const ride = attractionById(reservation.attractionId); return <section key={reservation.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">{reservation.status}</p><h3 className="mt-1 font-black">{ride?.name}</h3><p className="mt-1 text-sm text-white/55">{formatTime(reservation.returnStart)}–{formatTime(reservation.returnEnd)}</p></div>{reservation.status === "held" && <button onClick={() => onBook(reservation.id)} className={button}>Modify</button>}</div>{reservation.status === "held" && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => dispatch({ type: "SET_RESERVATION_STATUS", parkId, id: reservation.id, status: "redeemed", at: now.toISOString() })} className="min-h-11 rounded-xl bg-emerald-300 font-black text-emerald-950">Redeemed</button><button onClick={() => dispatch({ type: "SET_RESERVATION_STATUS", parkId, id: reservation.id, status: "cancelled", at: now.toISOString() })} className={button}>Cancelled</button></div>}</section>; })}</div><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => addPlan("EAT")} className={button}>+ Meal / rest</button><button onClick={() => addPlan("SHOW")} className={button}>+ Show</button></div><section className="mt-7"><div className="flex items-center gap-2"><History size={18} className="text-white/45" /><h3 className="font-black">Action history</h3></div><div className="mt-3 space-y-2">{day.history.length === 0 ? <p className="text-sm text-white/40">Actions will appear here.</p> : day.history.slice(-30).reverse().map((entry) => <div key={entry.id} className="flex gap-3 border-b border-white/5 py-2 text-sm"><time className="shrink-0 font-mono text-white/35">{formatTime(entry.at)}</time><span>{entry.label}</span></div>)}</div></section></div>;
}

function OfflineMapView({ parkId, now }: { parkId: ParkId; now: Date }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const preferences = state.preferences[parkId];
  const rides = attractionsForPark(parkId);
  const [zoom, setZoom] = useState(1.25);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selected = selectedId ? attractionById(selectedId) : undefined;
  const selectedStatus = selected ? day.attractionStates[selected.id] : undefined;
  const lats = rides.map((ride) => ride.latitude), lons = rides.map((ride) => ride.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const position = (ride: Attraction) => ({ left: `${8 + ((ride.longitude - minLon) / Math.max(0.0001, maxLon - minLon)) * 84}%`, top: `${8 + (1 - (ride.latitude - minLat) / Math.max(0.0001, maxLat - minLat)) * 84}%` });
  const landCenters = landsForPark(parkId).map((land) => {
    const members = rides.filter((ride) => ride.land === land);
    return { land, latitude: members.reduce((sum, ride) => sum + ride.latitude, 0) / members.length, longitude: members.reduce((sum, ride) => sum + ride.longitude, 0) / members.length };
  });
  const tierColor = (id: string) => { const tier = preferences.find((item) => item.attractionId === id)?.tier; return tier === "must" ? "bg-amber-300 text-amber-950" : tier === "nice" ? "bg-sky-300 text-sky-950" : tier === "convenient" ? "bg-emerald-300 text-emerald-950" : "bg-white/35 text-black"; };
  return <div><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Preloaded · works offline</p><h2 className="mt-1 text-2xl font-black">Interactive park map</h2><p className="mt-1 text-sm text-white/50">Schematic positions for planning—not turn-by-turn navigation.</p></div><div className="flex gap-1"><button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} className="grid size-11 place-items-center rounded-xl bg-white/5"><Minus size={18} /></button><button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))} className="grid size-11 place-items-center rounded-xl bg-white/5"><Plus size={18} /></button></div></div><div className="mt-5 max-h-[58dvh] overflow-auto rounded-[24px] border border-white/10 bg-[#0b1c18] shadow-inner"><div className="relative aspect-[4/5] min-h-[520px] origin-top-left overflow-hidden" style={{ width: `${zoom * 100}%`, minWidth: `${zoom * 100}%` }}><div className="absolute inset-[6%] rounded-[40%_50%_45%_35%] border-2 border-emerald-700/20 bg-[radial-gradient(circle_at_40%_35%,rgba(52,211,153,.13),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(56,189,248,.10),transparent_35%)]" />{landCenters.map((center) => <span key={center.land} style={position({ ...rides[0], latitude: center.latitude, longitude: center.longitude })} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-wider text-white/20">{center.land}</span>)}{rides.map((ride) => { const status = day.attractionStates[ride.id]; const unavailable = status?.temporarilyUnavailable; const complete = day.completedAttractionIds.includes(ride.id); return <button key={ride.id} aria-label={`${ride.name}${status?.standbyMinutes !== undefined ? `, ${status.standbyMinutes} minute wait` : ""}`} onClick={() => setSelectedId(ride.id)} style={position(ride)} className={`absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#07110f] text-[9px] font-black shadow-lg ${unavailable ? "bg-rose-400 text-rose-950" : complete ? "bg-white/20 text-white/40" : tierColor(ride.id)} ${selectedId === ride.id ? "ring-4 ring-white/30" : ""}`}>{complete ? "✓" : status?.standbyMinutes ?? "·"}</button>; })}</div></div><div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold text-white/45"><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-300" />Must Do</span><span><i className="mr-1 inline-block size-2 rounded-full bg-sky-300" />Nice</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-300" />Convenient</span><span>Pin number = standby minutes</span></div>{selected && <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-white/45">{selected.land}</p><h3 className="mt-1 text-lg font-black">{selected.name}</h3></div><button onClick={() => setSelectedId(undefined)} aria-label="Close map details" className="grid size-10 place-items-center rounded-xl bg-white/5"><X size={16} /></button></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p className="rounded-xl bg-black/15 p-3"><span className="block text-xs text-white/40">Standby</span><strong>{selectedStatus?.standbyMinutes !== undefined ? `${selectedStatus.standbyMinutes}m` : "Unknown"}</strong></p><p className="rounded-xl bg-black/15 p-3"><span className="block text-xs text-white/40">Lightning Lane</span><strong>{selected.lightningLane ? selectedStatus?.lightningLaneReturnStart ? formatTime(selectedStatus.lightningLaneReturnStart) : "Check app" : "Not offered"}</strong></p></div><p className="mt-3 text-xs text-white/45">{freshnessLabel(selectedStatus?.lastUpdatedAt, now)}</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => dispatch({ type: "SET_LOCATION", parkId, land: selected.land })} className={button}>I&apos;m here</button><button disabled={day.completedAttractionIds.includes(selected.id)} onClick={() => dispatch({ type: "COMPLETE_ATTRACTION", parkId, attractionId: selected.id, at: now.toISOString() })} className="min-h-11 rounded-xl bg-emerald-300 font-black text-emerald-950 disabled:opacity-35">Completed</button></div></section>}</div>;
}

function SettingsView({ parkId, onSetup }: { parkId: ParkId; onSetup: () => void }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const [parkOpen, setParkOpen] = useState(toLocalInput(day.config.parkOpen));
  const [parkClose, setParkClose] = useState(toLocalInput(day.config.parkClose));
  return <div>
    <h2 className="text-2xl font-black">Day settings</h2>
    <p className="mt-1 text-sm text-white/50">All controls remain manually correctable.</p>
    <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
      <label className="text-xs font-black uppercase tracking-wider text-white/45">Current land</label>
      <select className={`${input} mt-2`} value={day.currentLand ?? ""} onChange={(event) => dispatch({ type: "SET_LOCATION", parkId, land: event.target.value })}><option value="">Choose a land</option>{landsForPark(parkId).map((land) => <option className="bg-[#10221d]" key={land}>{land}</option>)}</select>
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-white/45">Energy</p>
      <div className="mt-2 grid grid-cols-3 gap-2">{(["good", "normal", "tired"] as FatigueLevel[]).map((level) => <button key={level} onClick={() => dispatch({ type: "SET_FATIGUE", parkId, level })} className={`${button} capitalize ${day.fatigueLevel === level ? "border-emerald-300 bg-emerald-300/15 text-emerald-200" : ""}`}>{level}</button>)}</div>
    </section>
    <section className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-amber-100">Official park hours</p>
      <label className="mt-3 block text-xs text-amber-100/60">Opening</label><input type="datetime-local" value={parkOpen} onChange={(event) => setParkOpen(event.target.value)} className={`${input} mt-1`} />
      <label className="mt-3 block text-xs text-amber-100/60">Closing</label><input type="datetime-local" value={parkClose} onChange={(event) => setParkClose(event.target.value)} className={`${input} mt-1`} />
      <button onClick={() => dispatch({ type: "SET_HOURS", parkId, parkOpen: fromLocalInput(parkOpen), parkClose: fromLocalInput(parkClose) })} className="mt-3 min-h-11 w-full rounded-xl bg-amber-200 font-black text-amber-950">{day.config.hoursConfirmed ? "Update confirmed hours" : "Confirm hours"}</button>
      <p className="mt-2 text-xs text-amber-100/50">Check these against the official Disneyland app.</p>
    </section>
    <button onClick={onSetup} className={`${button} mt-4 w-full`}>Edit ride priorities</button>
    {state.simulation && <button onClick={() => { if (confirm("Reset this simulated day?")) dispatch({ type: "RESET_DAY", parkId }); }} className="mt-5 min-h-11 w-full rounded-xl border border-rose-300/20 text-sm font-bold text-rose-200">Reset simulated day</button>}
  </div>;
}

function Dashboard() {
  const { state, dispatch, hydrated, loadMock } = useDisneyStore();
  const [view, setView] = useState<"now" | "update" | "plans" | "map" | "settings">("now");
  const [setupOverride, setSetupOverride] = useState(false);
  const [booking, setBooking] = useState<{ open: boolean; id?: string }>({ open: false });
  const [, setTick] = useState(0);
  const online = useOnline();
  const parkId = state.activeParkId; const day = state.days[parkId];
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
      const clock = day.simulatedTime ? new Date(day.simulatedTime) : new Date();
      day.reservations.filter((reservation) => reservation.status === "held" && new Date(reservation.returnEnd) < clock).forEach((reservation) => dispatch({ type: "SET_RESERVATION_STATUS", parkId, id: reservation.id, status: "expired", at: clock.toISOString() }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [day.reservations, day.simulatedTime, dispatch, parkId]);
  const now = day.simulatedTime ? new Date(day.simulatedTime) : new Date();
  const recommendation = recommendNow(day, state.preferences[parkId], now);
  const bookNext = recommendBookNext(day, state.preferences[parkId], now);
  const remaining = estimateRemainingMustDoMinutes(day, state.preferences[parkId]);
  if (!hydrated) return <div className="min-h-dvh grid place-items-center"><RefreshCw className="animate-spin text-emerald-300" /></div>;
  if (!state.setupComplete[parkId] || setupOverride) return <SetupScreen parkId={parkId} onDone={() => setSetupOverride(false)} />;

  const nav = [{ id: "now" as const, label: "Now", icon: Sparkles }, { id: "update" as const, label: "Update", icon: RefreshCw }, { id: "plans" as const, label: "LLs", icon: Ticket }, { id: "map" as const, label: "Map", icon: MapIcon }, { id: "settings" as const, label: "Setup", icon: Settings2 }];
  return <main className="min-h-dvh bg-[#07110f] text-[#f7f2e7]"><RegisterPwa /><div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]"><header className="mb-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{state.simulation ? "Simulation mode" : day.config.date}</p><h1 className="mt-1 text-2xl font-black">Park Day Optimizer</h1></div><div className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-black ${online ? "border-emerald-700/50 bg-emerald-950 text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`}>{online ? <Wifi size={12} /> : <CloudOff size={12} />}{online ? "ONLINE" : "OFFLINE"}</div></div><div className="mt-4 grid grid-cols-2 rounded-2xl bg-white/5 p-1">{(["disneyland", "california-adventure"] as ParkId[]).map((id) => <button key={id} onClick={() => { dispatch({ type: "SET_ACTIVE_PARK", parkId: id }); setView("now"); }} className={`min-h-11 rounded-xl px-2 text-xs font-black ${parkId === id ? "bg-emerald-300 text-emerald-950" : "text-white/45"}`}>{state.days[id].config.shortLabel}</button>)}</div></header>
    {state.simulation && <section className="mb-4 rounded-2xl border border-violet-300/30 bg-violet-300/10 p-3"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-violet-200">Simulated time</p><p className="font-black">{formatTime(now)}</p></div><button onClick={() => loadMock(parkId, now)} className={`${button} text-xs`}>Refresh crowd</button></div><div className="mt-2 grid grid-cols-3 gap-2">{[[15, "+15m"], [30, "+30m"], [60, "+1h"]].map(([amount, label]) => <button key={label} onClick={() => dispatch({ type: "SET_SIM_TIME", parkId, at: new Date(now.getTime() + Number(amount) * 60000).toISOString() })} className={button}>{label}</button>)}</div></section>}
    {view === "now" && <div className="space-y-4"><ActionCard action={recommendation} now={now} onComplete={(attractionId) => dispatch({ type: "COMPLETE_ATTRACTION", parkId, attractionId, at: now.toISOString() })} /><section className="rounded-3xl border border-emerald-700/50 bg-[#10221d] p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Book next</p><h2 className="mt-2 text-xl font-black">{bookNext?.title ?? (day.nextLightningLaneEligibleAt && new Date(day.nextLightningLaneEligibleAt) > now ? "Wait for eligibility" : "No valuable selection yet")}</h2></div><Sparkles className="text-emerald-300" /></div><p className="mt-2 text-sm font-bold text-white/65">{bookNext?.subtitle ?? "Keep the official app authoritative."}</p><p className="mt-3 text-sm leading-5 text-white/55">{bookNext?.reason ?? "Update return times or wait until the timer expires."}</p>{bookNext && <button onClick={() => setBooking({ open: true })} className="mt-4 min-h-11 w-full rounded-xl bg-emerald-300 font-black text-emerald-950">Record booking</button>}</section><TimerCard parkId={parkId} now={now} /><div className="grid grid-cols-2 gap-3"><section className="rounded-2xl border border-white/10 bg-white/5 p-4"><MapPin size={18} className="text-sky-300" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-white/45">Current land</p><p className="mt-1 font-black">{day.currentLand ?? "Set location"}</p></section><section className="rounded-2xl border border-white/10 bg-white/5 p-4"><BatteryMedium size={18} className="text-sky-300" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-white/45">Energy</p><p className="mt-1 font-black capitalize">{day.fatigueLevel}</p></section></div><Progress parkId={parkId} /><section className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-white/45">Estimated effort to finish remaining Must Dos</p><p className="mt-1 text-xl font-black">~{Math.floor(remaining / 60)}h {remaining % 60}m</p></section></div>}
    {view === "update" && <UpdateView parkId={parkId} now={now} />}{view === "plans" && <PlansView parkId={parkId} now={now} onBook={(id) => setBooking({ open: true, id })} />}{view === "map" && <OfflineMapView parkId={parkId} now={now} />}{view === "settings" && <SettingsView parkId={parkId} onSetup={() => setSetupOverride(true)} />}
  </div><nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07110f]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-5">{nav.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-black ${view === item.id ? "text-emerald-300" : "text-white/40"}`}><item.icon size={19} />{item.label}</button>)}</div></nav>{booking.open && <BookingModal parkId={parkId} now={now} reservationId={booking.id} onClose={() => setBooking({ open: false })} />}</main>;
}

export default function TripApp() {
  return <AccessGate><DisneyStoreProvider><Dashboard /></DisneyStoreProvider></AccessGate>;
}
