"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  CloudOff,
  Download,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  RotateCcw,
  Settings2,
  Sparkles,
  Ticket,
  Wifi,
  X,
} from "lucide-react";
import AccessGate from "./AccessGate";
import { attractionById, attractionsForPark, landsForPark } from "../data/attractions";
import { estimateRemainingPriorityMinutes, formatTime, freshnessLabel, recommendBookNext, recommendNow, recommendNowOptions } from "../optimizer/engine";
import { DisneyStoreProvider, useDisneyStore } from "../state/store";
import type { Attraction, FatigueLevel, ParkId, PriorityTier, ScoredAction } from "../types";

const ParkMap = dynamic(() => import("./ParkMap"), {
  ssr: false,
  loading: () => <div className="grid min-h-[480px] place-items-center rounded-3xl bg-white/5"><RefreshCw className="animate-spin text-emerald-300" /></div>,
});

const tierMeta: Record<PriorityTier, { label: string; stars: string; color: string }> = {
  must: { label: "MUST DO", stars: "★★★★★", color: "border-amber-300/50 bg-amber-300/10 text-amber-100" },
  nice: { label: "NICE TO HAVE", stars: "★★★★", color: "border-sky-300/40 bg-sky-300/10 text-sky-100" },
  convenient: { label: "IF CONVENIENT", stars: "★★", color: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" },
  "dont-care": { label: "SKIP", stars: "—", color: "border-white/10 bg-white/5 text-white/55" },
};

const button = "min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold transition active:scale-[.98] disabled:opacity-35";
const input = "min-h-12 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-base outline-none focus:border-emerald-300";
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
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

  if (unclassified && !ordering) return <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-6">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Trip setup · {state.days[parkId].config.shortLabel}</p>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-300" style={{ width: `${(preferences.length / rides.length) * 100}%` }} /></div>
    <p className="mt-2 text-xs text-white/50">{preferences.length} of {rides.length} rated</p>
    <section className="my-auto py-10 text-center">
      <p className="text-sm font-bold text-white/50">{unclassified.land}</p>
      <h1 className="mt-3 text-3xl font-black leading-tight">{unclassified.name}</h1>
      <div className="mt-8 grid gap-3">
        {(Object.keys(tierMeta) as PriorityTier[]).map((tier) => <button key={tier} onClick={() => dispatch({ type: "SET_TIER", parkId, attractionId: unclassified.id, tier })} className={`min-h-14 rounded-2xl border px-4 text-left font-black ${tierMeta[tier].color}`}><span className="mr-2">{tierMeta[tier].stars}</span>{tierMeta[tier].label}</button>)}
      </div>
    </section>
    <button onClick={() => rides.filter((ride) => !preferences.some((preference) => preference.attractionId === ride.id)).forEach((ride) => dispatch({ type: "SET_TIER", parkId, attractionId: ride.id, tier: "dont-care" }))} className={`${button} w-full text-white/60`}>Mark remaining Don&apos;t Care</button>
  </div>;

  return <div className="mx-auto min-h-dvh max-w-md px-4 pb-8 pt-6">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Final priority order</p>
    <h1 className="mt-2 text-3xl font-black">What matters most?</h1>
    <p className="mt-2 text-sm leading-6 text-white/55">Put the most important rides first. This order drives every recommendation.</p>
    <div className="mt-6 space-y-6">
      {(Object.keys(tierMeta) as PriorityTier[]).map((tier) => {
        const items = preferences.filter((preference) => preference.tier === tier).sort((a, b) => a.rankWithinTier - b.rankWithinTier);
        if (!items.length) return null;
        return <section key={tier}>
          <h2 className="text-xs font-black tracking-wider text-white/55">{tierMeta[tier].stars} {tierMeta[tier].label}</h2>
          <div className="mt-2 space-y-2">{items.map((preference, index) => <div key={preference.attractionId} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
            <span className="w-6 text-center text-sm font-black text-white/45">{index + 1}</span>
            <span className="min-w-0 flex-1 text-sm font-bold">{attractionById(preference.attractionId)?.name}</span>
            <button aria-label={`Move ${attractionById(preference.attractionId)?.name} up`} disabled={index === 0} onClick={() => dispatch({ type: "MOVE_PREFERENCE", parkId, attractionId: preference.attractionId, direction: -1 })} className="grid size-10 place-items-center rounded-lg bg-white/5 disabled:opacity-20"><ArrowUp size={16} /></button>
            <button aria-label={`Move ${attractionById(preference.attractionId)?.name} down`} disabled={index === items.length - 1} onClick={() => dispatch({ type: "MOVE_PREFERENCE", parkId, attractionId: preference.attractionId, direction: 1 })} className="grid size-10 place-items-center rounded-lg bg-white/5 disabled:opacity-20"><ArrowDown size={16} /></button>
          </div>)}</div>
        </section>;
      })}
    </div>
    <button onClick={() => { dispatch({ type: "SET_SETUP_COMPLETE", parkId, complete: true }); onDone(); }} className="mt-8 min-h-14 w-full rounded-2xl bg-emerald-300 font-black text-emerald-950">Start optimizing</button>
    <button onClick={() => setOrdering(false)} className={`${button} mt-3 w-full`}>Rate rides again</button>
  </div>;
}

function actionKey(action: ScoredAction) {
  return `${action.type}:${action.attractionId ?? action.planId ?? action.title}`;
}

function ActionCard({ action, selected, onComplete }: { action: ScoredAction; selected: boolean; onComplete: (id: string) => void }) {
  return <section className="rounded-[28px] border border-amber-300/40 bg-gradient-to-br from-amber-200 to-orange-300 p-5 text-[#25180b] shadow-2xl shadow-amber-950/25">
    <p className="text-xs font-black uppercase tracking-[0.24em]">{selected ? "Your selected action" : "Best action now"}</p>
    <h2 className="mt-4 text-3xl font-black leading-none">{action.title}</h2>
    <p className="mt-3 text-sm font-black">{action.subtitle}</p>
    <p className="mt-5 border-t border-black/15 pt-4 text-sm leading-5"><span className="font-black">Why: </span>{action.reason}</p>
    {action.attractionId && <button onClick={() => onComplete(action.attractionId!)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25180b] px-4 font-black text-amber-100"><Check size={18} /> Done with this ride</button>}
  </section>;
}

function dateAtTime(date: string, value: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = value.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function timeInputValue(value: string | Date) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function BookingModal({ parkId, now, onClose, reservationId, initialAttractionId }: { parkId: ParkId; now: Date; onClose: () => void; reservationId?: string; initialAttractionId?: string }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const existing = day.reservations.find((item) => item.id === reservationId);
  const eligible = attractionsForPark(parkId).filter((ride) => ride.lightningLane && !ride.singlePass);
  const [attractionId, setAttractionId] = useState(existing?.attractionId ?? initialAttractionId ?? eligible[0]?.id ?? "");
  const suggested = existing?.returnStart ?? day.attractionStates[initialAttractionId ?? ""]?.lightningLaneReturnStart ?? new Date(now.getTime() + 60 * 60000);
  const [returnTime, setReturnTime] = useState(timeInputValue(suggested));

  function save(event: React.FormEvent) {
    event.preventDefault();
    const start = dateAtTime(day.config.date, returnTime);
    const end = new Date(start.getTime() + 60 * 60000);
    if (existing) dispatch({ type: "MODIFY_RESERVATION", parkId, id: existing.id, returnStart: start.toISOString(), returnEnd: end.toISOString(), at: now.toISOString() });
    else dispatch({ type: "BOOK_RESERVATION", parkId, reservation: { id: uid(), attractionId, bookedAt: now.toISOString(), returnStart: start.toISOString(), returnEnd: end.toISOString(), status: "held" } });
    onClose();
  }

  return <div className="fixed inset-0 z-[80] grid items-end bg-black/70 p-3 sm:items-center">
    <form onSubmit={save} className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#10221d] p-5">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black">{existing ? "Change LL time" : "Record LL booking"}</h2><button type="button" aria-label="Close" onClick={onClose} className="grid size-11 place-items-center rounded-xl bg-white/5"><X /></button></div>
      {!existing && <><label htmlFor="booking-attraction" className="mt-5 block text-xs font-bold uppercase tracking-wider text-white/50">Ride</label><select id="booking-attraction" className={`${input} mt-2`} value={attractionId} onChange={(event) => setAttractionId(event.target.value)}>{eligible.map((ride) => <option className="bg-[#10221d]" key={ride.id} value={ride.id}>{ride.name}</option>)}</select></>}
      <label htmlFor="booking-time" className="mt-4 block text-xs font-bold uppercase tracking-wider text-white/50">Return time today</label>
      <input id="booking-time" required type="time" className={`${input} mt-2`} value={returnTime} onChange={(event) => setReturnTime(event.target.value)} />
      <p className="mt-2 text-xs text-white/45">The return window is set to one hour automatically.</p>
      <button className="mt-5 min-h-12 w-full rounded-xl bg-emerald-300 font-black text-emerald-950">{existing ? "Update booking" : "Save booking"}</button>
    </form>
  </div>;
}

function TimerCard({ parkId, now }: { parkId: ParkId; now: Date }) {
  const { state, dispatch } = useDisneyStore();
  const eligibleAt = state.days[parkId].nextLightningLaneEligibleAt;
  const seconds = eligibleAt ? Math.max(0, Math.ceil((new Date(eligibleAt).getTime() - now.getTime()) / 1000)) : 0;
  const label = seconds <= 0 ? "READY" : `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(String(Math.floor(seconds / 3600)));
  const [minutes, setMinutes] = useState(String(Math.floor((seconds % 3600) / 60)));

  function openEditor() {
    setHours(String(Math.floor(seconds / 3600)));
    setMinutes(String(Math.floor((seconds % 3600) / 60)));
    setEditing(true);
  }

  function saveTimer(event: React.FormEvent) {
    event.preventDefault();
    const duration = Math.max(0, Number(hours) * 60 + Number(minutes));
    dispatch({ type: "CORRECT_TIMER", parkId, at: duration > 0 ? new Date(now.getTime() + duration * 60000).toISOString() : undefined });
    setEditing(false);
  }

  return <section className="rounded-2xl border border-sky-300/25 bg-sky-300/10 p-4">
    <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Next LL booking</p><p className="mt-1 text-3xl font-black tabular-nums">{label}</p></div><Clock3 className="text-sky-200" /></div>
    <button onClick={openEditor} className="mt-3 min-h-11 w-full rounded-xl border border-sky-200/15 bg-sky-950/20 text-sm font-black text-sky-100">Adjust countdown</button>
    {editing && <div className="fixed inset-0 z-[80] grid items-end bg-black/70 p-3 sm:items-center"><form onSubmit={saveTimer} className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#10221d] p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-sky-200">LL eligibility</p><h2 className="mt-1 text-xl font-black">Adjust countdown</h2></div><button type="button" aria-label="Close countdown editor" onClick={() => setEditing(false)} className="grid size-11 place-items-center rounded-xl bg-white/5"><X /></button></div><p className="mt-3 text-sm text-white/50">Set how much time remains on the current two-hour booking clock.</p><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-black uppercase tracking-wider text-white/45">Hours<input aria-label="Countdown hours" type="number" inputMode="numeric" min="0" max="23" value={hours} onChange={(event) => setHours(event.target.value)} className={`${input} mt-2`} /></label><label className="text-xs font-black uppercase tracking-wider text-white/45">Minutes<input aria-label="Countdown minutes" type="number" inputMode="numeric" min="0" max="59" value={minutes} onChange={(event) => setMinutes(event.target.value)} className={`${input} mt-2`} /></label></div><button className="mt-5 min-h-12 w-full rounded-xl bg-emerald-300 font-black text-emerald-950">Save countdown</button><button type="button" onClick={() => { dispatch({ type: "CORRECT_TIMER", parkId }); setEditing(false); }} className={`${button} mt-2 w-full`}>Ready now</button></form></div>}
  </section>;
}

function WaitEditor({ parkId, ride, now }: { parkId: ParkId; ride: Attraction; now: Date }) {
  const { state, dispatch } = useDisneyStore();
  const current = state.days[parkId].attractionStates[ride.id]?.standbyMinutes;
  const [value, setValue] = useState(current === undefined ? "" : String(current));

  function save(event: React.FormEvent) {
    event.preventDefault();
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes < 0) return;
    dispatch({ type: "UPDATE_STATUS", parkId, status: { attractionId: ride.id, standbyMinutes: Math.round(minutes), lastUpdatedAt: now.toISOString(), source: state.simulation ? "mock" : "manual" }, label: `Updated ${ride.name} wait → ${Math.round(minutes)}m` });
  }

  return <form onSubmit={save} className="mt-3">
    <label htmlFor={`wait-${ride.id}`} className="text-[10px] font-black uppercase tracking-wider text-white/45">Update standby minutes</label>
    <div className="mt-1 flex gap-2"><input id={`wait-${ride.id}`} aria-label={`Wait minutes for ${ride.name}`} type="number" inputMode="numeric" min="0" step="1" placeholder="Minutes" value={value} onChange={(event) => setValue(event.target.value)} className={`${input} min-w-0 flex-1`} /><button aria-label={`Save wait for ${ride.name}`} className="min-h-12 rounded-xl bg-white/10 px-4 font-black">Save</button></div>
    <p className="mt-1 text-[11px] text-white/40">Tip: 13 minutes usually means no line.</p>
  </form>;
}

function RideCard({ parkId, ride, now, onBook }: { parkId: ParkId; ride: Attraction; now: Date; onBook: (attractionId: string) => void }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const preference = state.preferences[parkId].find((item) => item.attractionId === ride.id);
  const status = day.attractionStates[ride.id];
  const wait = status?.standbyMinutes;
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">{tierMeta[preference?.tier ?? "dont-care"].label} · {ride.land}</p><h3 className="mt-1 text-lg font-black">{ride.name}</h3><p className="mt-1 text-xs text-white/40">{freshnessLabel(status?.lastUpdatedAt, now)}{status?.source ? ` · ${status.source}` : ""}</p></div><div className="text-right"><p className="text-2xl font-black">{wait === undefined ? "—" : wait === 13 ? "13m" : `${wait}m`}</p>{wait === 13 && <p className="text-[10px] font-black text-emerald-300">NO LINE</p>}</div></div>
    {status?.temporarilyUnavailable && <p className="mt-3 rounded-lg bg-rose-300/10 p-2 text-xs font-black text-rose-200">Temporarily unavailable</p>}
    {status?.lightningLaneReturnStart && <p className="mt-3 text-sm font-bold text-sky-200">LL return: {formatTime(status.lightningLaneReturnStart)}</p>}
    <WaitEditor key={wait ?? "unknown"} parkId={parkId} ride={ride} now={now} />
    <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => dispatch({ type: "COMPLETE_ATTRACTION", parkId, attractionId: ride.id, at: now.toISOString() })} className="min-h-11 rounded-xl bg-emerald-300 font-black text-emerald-950"><Check size={16} className="mr-1 inline" />Done</button>{ride.lightningLane ? <button onClick={() => onBook(ride.id)} className={button}><Ticket size={16} className="mr-1 inline" />Record LL</button> : <button onClick={() => dispatch({ type: "SET_LOCATION", parkId, land: ride.land })} className={button}><MapPin size={16} className="mr-1 inline" />I&apos;m here</button>}</div>
  </section>;
}

function HeldBookings({ parkId, now, onModify }: { parkId: ParkId; now: Date; onModify: (id: string) => void }) {
  const { state, dispatch } = useDisneyStore();
  const held = state.days[parkId].reservations.filter((reservation) => reservation.status === "held").sort((a, b) => new Date(a.returnEnd).getTime() - new Date(b.returnEnd).getTime());
  return <section>
    <h2 className="text-lg font-black">Held Lightning Lanes</h2>
    {!held.length && <p className="mt-2 rounded-2xl border border-dashed border-white/15 p-4 text-sm text-white/45">No LL bookings recorded.</p>}
    <div className="mt-2 space-y-2">{held.map((reservation) => <div key={reservation.id} className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{attractionById(reservation.attractionId)?.name}</p><p className="mt-1 text-sm text-sky-100">{formatTime(reservation.returnStart)}–{formatTime(reservation.returnEnd)}</p></div><Ticket className="text-sky-200" /></div><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => dispatch({ type: "SET_RESERVATION_STATUS", parkId, id: reservation.id, status: "redeemed", at: now.toISOString() })} className="min-h-10 rounded-lg bg-emerald-300 text-xs font-black text-emerald-950">Used</button><button onClick={() => onModify(reservation.id)} className="min-h-10 rounded-lg bg-white/10 text-xs font-black">Change</button><button onClick={() => dispatch({ type: "SET_RESERVATION_STATUS", parkId, id: reservation.id, status: "cancelled", at: now.toISOString() })} className="min-h-10 rounded-lg bg-white/10 text-xs font-black text-rose-200">Cancel</button></div></div>)}</div>
  </section>;
}

function QueuesView({ parkId, now, online, onBook }: { parkId: ParkId; now: Date; online: boolean; onBook: (id?: string, attractionId?: string) => void }) {
  const { state, refreshLive } = useDisneyStore();
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const day = state.days[parkId];
  const rides = useMemo(() => state.preferences[parkId]
    .filter((preference) => preference.tier !== "dont-care" && !day.completedAttractionIds.includes(preference.attractionId))
    .sort((a, b) => ["must", "nice", "convenient"].indexOf(a.tier) - ["must", "nice", "convenient"].indexOf(b.tier) || a.rankWithinTier - b.rankWithinTier)
    .flatMap((preference) => { const ride = attractionById(preference.attractionId); return ride ? [ride] : []; }), [day.completedAttractionIds, parkId, state.preferences]);
  const otherRides = useMemo(() => attractionsForPark(parkId).filter((ride) => !rides.some((priorityRide) => priorityRide.id === ride.id) && !day.completedAttractionIds.includes(ride.id)), [day.completedAttractionIds, parkId, rides]);

  async function refresh() {
    setRefreshing(true);
    setMessage("");
    try { const count = await refreshLive(parkId); setMessage(`Updated ${count} attractions`); }
    catch { setMessage("Live update failed. Saved waits are still available."); }
    finally { setRefreshing(false); }
  }

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-black">Queues</h2><p className="mt-1 text-sm text-white/50">Only your unfinished priorities.</p></div><button disabled={!online || refreshing} onClick={refresh} className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-300 px-3 text-sm font-black text-emerald-950 disabled:opacity-40"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />Refresh live</button></div>
    {message && <p role="status" className="rounded-xl bg-white/5 p-3 text-sm text-white/65">{message}</p>}
    <HeldBookings parkId={parkId} now={now} onModify={(id) => onBook(id)} />
    <div><h2 className="text-lg font-black">Priority rides</h2><p className="mt-1 text-xs text-white/45">Sorted by the priority order you set.</p></div>
    {!rides.length && <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/45">All priority rides are done, or no priorities were selected.</p>}
    {rides.map((ride) => <RideCard key={ride.id} parkId={parkId} ride={ride} now={now} onBook={(attractionId) => onBook(undefined, attractionId)} />)}
    {otherRides.length > 0 && <details className="rounded-2xl border border-white/10 bg-white/[.03] p-3"><summary className="min-h-11 cursor-pointer px-1 py-3 text-sm font-black">Other rides ({otherRides.length})</summary><p className="mb-3 px-1 text-xs text-white/45">Open only when you need to add or correct another standby wait.</p><div className="space-y-3">{otherRides.map((ride) => <RideCard key={ride.id} parkId={parkId} ride={ride} now={now} onBook={(attractionId) => onBook(undefined, attractionId)} />)}</div></details>}
  </div>;
}

function MapView({ parkId, now }: { parkId: ParkId; now: Date }) {
  const { state, dispatch } = useDisneyStore();
  const [selectedId, setSelectedId] = useState<string>();
  const day = state.days[parkId];
  const preferences = state.preferences[parkId];
  const rides = attractionsForPark(parkId);
  const selected = selectedId ? attractionById(selectedId) : undefined;
  const selectedStatus = selected ? day.attractionStates[selected.id] : undefined;
  const markers = rides.map((attraction) => ({ attraction, tier: preferences.find((item) => item.attractionId === attraction.id)?.tier, wait: day.attractionStates[attraction.id]?.standbyMinutes, unavailable: day.attractionStates[attraction.id]?.temporarilyUnavailable, completed: day.completedAttractionIds.includes(attraction.id) }));
  return <div>
    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Live geographic view</p>
    <h2 className="mt-1 text-2xl font-black">Interactive park map</h2>
    <p className="mt-1 text-sm text-white/50">Real basemap with your priorities and waits overlaid.</p>
    <div className="mt-4 overflow-hidden rounded-3xl border border-white/10"><ParkMap markers={markers} onSelect={setSelectedId} /></div>
    <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold text-white/45"><span>● Must Do</span><span className="text-sky-300">● Nice</span><span className="text-emerald-300">● Convenient</span><span>Number = standby</span></div>
    {selected && <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs text-white/45">{selected.land}</p><h3 className="mt-1 text-lg font-black">{selected.name}</h3></div><button aria-label="Close map details" onClick={() => setSelectedId(undefined)} className="grid size-10 place-items-center rounded-xl bg-white/5"><X size={16} /></button></div><p className="mt-3 text-sm"><strong>{selectedStatus?.standbyMinutes === undefined ? "Wait unknown" : selectedStatus.standbyMinutes === 13 ? "13m · usually no line" : `${selectedStatus.standbyMinutes}m standby`}</strong>{selectedStatus?.lightningLaneReturnStart ? ` · LL ${formatTime(selectedStatus.lightningLaneReturnStart)}` : ""}</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => dispatch({ type: "SET_LOCATION", parkId, land: selected.land })} className={button}>I&apos;m here</button><button disabled={day.completedAttractionIds.includes(selected.id)} onClick={() => dispatch({ type: "COMPLETE_ATTRACTION", parkId, attractionId: selected.id, at: now.toISOString() })} className="min-h-11 rounded-xl bg-emerald-300 font-black text-emerald-950 disabled:opacity-35">Done</button></div></section>}
  </div>;
}

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function SettingsView({ parkId, onSetup }: { parkId: ParkId; onSetup: () => void }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent>();
  const [storageStatus, setStorageStatus] = useState<"checking" | "persistent" | "standard">("checking");

  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", capture);
    navigator.storage?.persisted?.().then((value) => setStorageStatus(value ? "persistent" : "standard")).catch(() => setStorageStatus("standard"));
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  async function keepOnPhone() {
    if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(undefined); }
    const persistent = await navigator.storage?.persist?.().catch(() => false);
    setStorageStatus(persistent ? "persistent" : "standard");
  }

  return <div>
    <h2 className="text-2xl font-black">Setup</h2>
    <p className="mt-1 text-sm text-white/50">The essentials for today.</p>
    <section className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4"><div className="flex gap-3"><Download className="shrink-0 text-emerald-300" /><div><h3 className="font-black">Keep on this phone</h3><p className="mt-1 text-sm leading-5 text-white/55">Your ratings, waits, bookings, and completed rides save automatically on this device.</p></div></div><button onClick={keepOnPhone} className="mt-4 min-h-12 w-full rounded-xl bg-emerald-300 font-black text-emerald-950">{storageStatus === "persistent" ? "Saved for offline use" : "Install & protect saved data"}</button>{storageStatus === "standard" && <p className="mt-2 text-xs text-white/40">On iPhone, also use Share → Add to Home Screen.</p>}</section>
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"><label htmlFor="current-land" className="text-xs font-black uppercase tracking-wider text-white/45">Current land</label><select id="current-land" className={`${input} mt-2`} value={day.currentLand ?? ""} onChange={(event) => dispatch({ type: "SET_LOCATION", parkId, land: event.target.value })}><option value="">Choose a land</option>{landsForPark(parkId).map((land) => <option className="bg-[#10221d]" key={land}>{land}</option>)}</select><p className="mt-4 text-xs font-black uppercase tracking-wider text-white/45">Energy</p><div className="mt-2 grid grid-cols-3 gap-2">{(["good", "normal", "tired"] as FatigueLevel[]).map((level) => <button key={level} onClick={() => dispatch({ type: "SET_FATIGUE", parkId, level })} className={`${button} capitalize ${day.fatigueLevel === level ? "border-emerald-300 bg-emerald-300/15 text-emerald-200" : ""}`}>{level}</button>)}</div></section>
    <button onClick={onSetup} className={`${button} mt-4 w-full`}>Edit ride priorities</button>
    <button onClick={() => { if (confirm(`Reset ${day.config.shortLabel}? This clears ratings, waits, bookings, and completed rides on this device.`)) dispatch({ type: "RESET_DAY", parkId }); }} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/25 text-sm font-black text-rose-200"><RotateCcw size={17} />Reset this park day</button>
  </div>;
}

function DaySnapshot({ parkId }: { parkId: ParkId }) {
  const { state, dispatch } = useDisneyStore();
  const day = state.days[parkId];
  const completed = day.completedAttractionIds.flatMap((id) => { const ride = attractionById(id); return ride ? [ride] : []; });
  const prioritiesLeft = state.preferences[parkId].filter((preference) => preference.tier !== "dont-care" && !day.completedAttractionIds.includes(preference.attractionId)).length;
  const held = day.reservations.filter((reservation) => reservation.status === "held").sort((a, b) => new Date(a.returnStart).getTime() - new Date(b.returnStart).getTime());

  return <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-white/45">Your position</p><p className="mt-1 text-sm text-white/50">Updates walking and LL guidance.</p></div><MapPin size={20} className="text-emerald-300" /></div>
    <select aria-label="Current position" className={`${input} mt-3`} value={day.currentLand ?? ""} onChange={(event) => dispatch({ type: "SET_LOCATION", parkId, land: event.target.value })}><option value="">Choose current land</option>{landsForPark(parkId).map((land) => <option className="bg-[#10221d]" key={land}>{land}</option>)}</select>
    <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/15 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-white/40">Done</p><p className="mt-1 text-xl font-black">{completed.length}</p></div><div className="rounded-xl bg-black/15 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-white/40">Priorities left</p><p className="mt-1 text-xl font-black">{prioritiesLeft}</p></div></div>
    <div className="mt-4"><p className="text-xs font-black uppercase tracking-wider text-sky-200">LL hopper</p>{held.length === 0 ? <p className="mt-2 text-sm text-white/40">No held bookings.</p> : <div className="mt-2 space-y-2">{held.map((reservation) => <div key={reservation.id} className="flex items-center justify-between gap-3 rounded-xl bg-sky-300/10 px-3 py-2"><span className="text-sm font-black">{attractionById(reservation.attractionId)?.name}</span><span className="shrink-0 text-xs font-bold text-sky-100">{formatTime(reservation.returnStart)}</span></div>)}</div>}</div>
    {completed.length > 0 && <details className="mt-4 border-t border-white/10 pt-3"><summary className="min-h-10 cursor-pointer py-2 text-sm font-black">See completed rides</summary><p className="mt-1 text-sm leading-6 text-white/50">{completed.map((ride) => ride.name).join(" · ")}</p></details>}
  </section>;
}

function Dashboard() {
  const { state, dispatch, hydrated, loadMock } = useDisneyStore();
  const [view, setView] = useState<"now" | "queues" | "map" | "settings">("now");
  const [setupOverride, setSetupOverride] = useState(false);
  const [booking, setBooking] = useState<{ open: boolean; id?: string; attractionId?: string }>({ open: false });
  const [selectedActionKey, setSelectedActionKey] = useState<string>();
  const [, setTick] = useState(0);
  const online = useOnline();
  const parkId = state.activeParkId;
  const day = state.days[parkId];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
      const clock = day.simulatedTime ? new Date(day.simulatedTime) : new Date();
      day.reservations.filter((reservation) => reservation.status === "held" && new Date(reservation.returnEnd) < clock).forEach((reservation) => dispatch({ type: "SET_RESERVATION_STATUS", parkId, id: reservation.id, status: "expired", at: clock.toISOString() }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [day.reservations, day.simulatedTime, dispatch, parkId]);

  const now = day.simulatedTime ? new Date(day.simulatedTime) : new Date();
  const actionOptions = recommendNowOptions(day, state.preferences[parkId], now);
  const selectedAction = actionOptions.find((action) => actionKey(action) === selectedActionKey);
  const recommendation = selectedAction ?? recommendNow(day, state.preferences[parkId], now);
  const alternatives = actionOptions.filter((action) => actionKey(action) !== actionKey(recommendation)).slice(0, 2);
  const bookNext = recommendBookNext(day, state.preferences[parkId], now);
  const remainingPriorityMinutes = estimateRemainingPriorityMinutes(day, state.preferences[parkId]);
  if (!hydrated) return <div className="grid min-h-dvh place-items-center"><RefreshCw className="animate-spin text-emerald-300" /></div>;
  if (!state.setupComplete[parkId] || setupOverride) return <SetupScreen parkId={parkId} onDone={() => { setSetupOverride(false); setView("queues"); }} />;

  const nav = [{ id: "now" as const, label: "Now", icon: Sparkles }, { id: "queues" as const, label: "Queues", icon: Ticket }, { id: "map" as const, label: "Map", icon: MapIcon }, { id: "settings" as const, label: "Setup", icon: Settings2 }];
  return <main className="min-h-dvh bg-[#07110f] text-[#f7f2e7]"><RegisterPwa /><div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
    <header className="mb-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{state.simulation ? "Simulation mode" : day.config.date}</p><h1 className="mt-1 text-2xl font-black">Park Day Optimizer</h1></div><div className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-black ${online ? "border-emerald-700/50 bg-emerald-950 text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`}>{online ? <Wifi size={12} /> : <CloudOff size={12} />}{online ? "ONLINE" : "OFFLINE"}</div></div><div className="mt-4 grid grid-cols-2 rounded-2xl bg-white/5 p-1">{(["disneyland", "california-adventure"] as ParkId[]).map((id) => <button key={id} onClick={() => { dispatch({ type: "SET_ACTIVE_PARK", parkId: id }); setView("now"); }} className={`min-h-11 rounded-xl px-2 text-xs font-black ${parkId === id ? "bg-emerald-300 text-emerald-950" : "text-white/45"}`}>{state.days[id].config.shortLabel}</button>)}</div></header>
    {state.simulation && <section className="mb-4 rounded-2xl border border-violet-300/30 bg-violet-300/10 p-3"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-violet-200">Simulated time</p><p className="font-black">{formatTime(now)}</p></div><button onClick={() => loadMock(parkId, now)} className={`${button} text-xs`}>Refresh crowd</button></div><div className="mt-2 grid grid-cols-3 gap-2">{[[15, "+15m"], [30, "+30m"], [60, "+1h"]].map(([amount, label]) => <button key={label} onClick={() => dispatch({ type: "SET_SIM_TIME", parkId, at: new Date(now.getTime() + Number(amount) * 60000).toISOString() })} className={button}>{label}</button>)}</div></section>}
    {view === "now" && <div className="space-y-4"><ActionCard action={recommendation} selected={Boolean(selectedAction)} onComplete={(attractionId) => { dispatch({ type: "COMPLETE_ATTRACTION", parkId, attractionId, at: now.toISOString() }); setSelectedActionKey(undefined); }} /><DaySnapshot parkId={parkId} />{alternatives.length > 0 && <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black uppercase tracking-wider text-white/45">Other good options</p><div className="mt-2 divide-y divide-white/10">{alternatives.map((action) => <button type="button" aria-label={`Choose ${action.title}`} onClick={() => setSelectedActionKey(actionKey(action))} key={actionKey(action)} className="flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left"><div><p className="font-black">{action.title}</p><p className="mt-1 text-xs text-white/45">{action.subtitle}</p></div><span className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-xs font-black text-emerald-200">Choose</span></button>)}</div></section>}<section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-300">Book next</p><h2 className="mt-2 text-lg font-black">{bookNext?.title ?? "No booking needed yet"}</h2><p className="mt-1 text-sm text-white/55">{bookNext?.subtitle ?? "Use the countdown, then check again."}</p>{bookNext && <button onClick={() => setBooking({ open: true, attractionId: bookNext.attractionId })} className="mt-3 min-h-11 w-full rounded-xl bg-emerald-300 font-black text-emerald-950">Record this LL</button>}</section><TimerCard parkId={parkId} now={now} /><section className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black uppercase tracking-wider text-white/45">Estimated time to finish priorities</p><p className="mt-2 text-2xl font-black">{remainingPriorityMinutes === 0 ? "All done" : `~${Math.floor(remainingPriorityMinutes / 60)}h ${remainingPriorityMinutes % 60}m`}</p><p className="mt-1 text-xs text-white/40">Uses current waits when available, plus ride and walking time.</p></section></div>}
    {view === "queues" && <QueuesView parkId={parkId} now={now} online={online} onBook={(id, attractionId) => setBooking({ open: true, id, attractionId })} />}
    {view === "map" && <MapView parkId={parkId} now={now} />}
    {view === "settings" && <SettingsView parkId={parkId} onSetup={() => setSetupOverride(true)} />}
  </div><nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07110f]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-4">{nav.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-black ${view === item.id ? "text-emerald-300" : "text-white/40"}`}><item.icon size={19} />{item.label}</button>)}</div></nav>{booking.open && <BookingModal parkId={parkId} now={now} reservationId={booking.id} initialAttractionId={booking.attractionId} onClose={() => setBooking({ open: false })} />}</main>;
}

export default function TripApp() {
  return <AccessGate><DisneyStoreProvider><Dashboard /></DisneyStoreProvider></AccessGate>;
}
