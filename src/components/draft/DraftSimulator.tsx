"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";
import PositionFilter from "./PositionFilter";
import { POS_COLOR, type DraftMeta, type LeagueConfig, type Position } from "@/data/draft-analysis";
import { recommendPlayers, type StrategyPlayer } from "@/lib/draft-strategy";

const KEY = "draft_sim_v2";
interface SimState { taken: Record<string, "me" | "other">; mine: string[] }
interface SnakePick { round: number; overall: number; pickInRound: number }
const simListeners = new Set<() => void>();
function subscribeSim(callback: () => void) {
  simListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => { simListeners.delete(callback); window.removeEventListener("storage", callback); };
}
const simSnapshot = () => localStorage.getItem(KEY) ?? "";
const serverSimSnapshot = () => "";
function parseSim(raw: string): SimState {
  try { const saved = raw ? JSON.parse(raw) : null; return saved?.taken && Array.isArray(saved.mine) ? saved : { taken: {}, mine: [] }; }
  catch { return { taken: {}, mine: [] }; }
}

function snakePicks(teams: number, rounds: number, slot: number): SnakePick[] {
  return Array.from({ length: rounds }, (_, i) => {
    const round = i + 1;
    const odd = round % 2 === 1;
    return { round, overall: odd ? i * teams + slot : round * teams - slot + 1, pickInRound: odd ? slot : teams - slot + 1 };
  });
}

export default function DraftSimulator({ players, meta, config }: { players: StrategyPlayer[]; meta: DraftMeta; config: LeagueConfig }) {
  const stateRaw = useSyncExternalStore(subscribeSim, simSnapshot, serverSimSnapshot);
  const state = useMemo(() => parseSim(stateRaw), [stateRaw]);
  const setState = (action: SimState | ((current: SimState) => SimState)) => {
    const next = typeof action === "function" ? action(state) : action;
    localStorage.setItem(KEY, JSON.stringify(next));
    simListeners.forEach((listener) => listener());
  };
  const [posFilter, setPosFilter] = useState<"All" | Position>("All");
  const [query, setQuery] = useState("");
  const { taken, mine } = state;
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const myTeam = useMemo(() => mine.map((id) => byId.get(id)).filter(Boolean) as StrategyPlayer[], [mine, byId]);
  const picks = useMemo(() => snakePicks(config.teams, meta.rounds, config.draftSlot), [config.teams, config.draftSlot, meta.rounds]);
  const currentOverall = Object.keys(taken).length + 1;
  const pickIndex = picks.findIndex((p) => p.overall >= currentOverall);
  const myNext = pickIndex >= 0 ? picks[pickIndex] : null;
  const following = pickIndex >= 0 ? picks[pickIndex + 1] ?? null : null;
  const available = useMemo(() => players.filter((p) => !taken[p.id]).sort((a, b) => b.adjustedVor - a.adjustedVor), [players, taken]);
  const roster = useMemo(() => myTeam.reduce<Partial<Record<Position, number>>>((acc, p) => ({ ...acc, [p.pos]: (acc[p.pos] ?? 0) + 1 }), {}), [myTeam]);
  const recommendations = useMemo(
    () => myNext ? recommendPlayers(available, myNext.overall, following?.overall ?? null, roster) : [],
    [available, following?.overall, myNext, roster],
  );
  const projectedPlan = useMemo(() => picks.map((pick, index) => ({ pick, player: index < myTeam.length ? myTeam[index] : index === myTeam.length ? recommendations[0]?.player : null })), [picks, myTeam, recommendations]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter((p) => (posFilter === "All" || p.pos === posFilter) && (!q || p.name.toLowerCase().includes(q))).slice(0, 70);
  }, [available, posFilter, query]);

  const markMine = (id: string) => setState((s) => ({ taken: { ...s.taken, [id]: "me" }, mine: [...s.mine.filter((x) => x !== id), id] }));
  const markOther = (id: string) => setState((s) => ({ taken: { ...s.taken, [id]: "other" }, mine: s.mine.filter((x) => x !== id) }));
  const undo = (id: string) => setState((s) => { const next = { ...s.taken }; delete next[id]; return { taken: next, mine: s.mine.filter((x) => x !== id) }; });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-xs text-text-muted">
        <span>slot {config.draftSlot} of {config.teams}</span><span>•</span><span>overall #{currentOverall}</span><span>•</span><span>{config.riskMode} model</span>
        <button onClick={() => setState({ taken: {}, mine: [] })} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-border-accent cursor-pointer"><RotateCcw size={13} /> reset draft</button>
      </div>

      {myNext && recommendations.length > 0 && (
        <div className="grid md:grid-cols-3 gap-2 mb-4">
          {recommendations.map((rec, i) => (
            <div key={rec.player.id} className={`rounded-xl border p-3 ${i === 0 ? "border-border-accent bg-accent-dim/20" : "border-border bg-surface"}`}>
              <div className="font-mono text-[11px] text-accent-text mb-1">#{i + 1} at R{myNext.round}.{String(myNext.pickInRound).padStart(2, "0")}</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: POS_COLOR[rec.player.pos] }} /><strong className="text-text-primary">{rec.player.name}</strong><span className="font-mono text-xs text-text-muted">{rec.player.pos}</span></div>
              <p className="font-mono text-xs text-text-muted mt-1">VOR {rec.player.adjustedVor} · model {rec.expectedEdge}</p>
              <p className="text-xs text-text-muted mt-1">{rec.reason}</p>
              {rec.player.newsMultiplier !== 1 && <p className="font-mono text-[11px] text-accent-text mt-1">news {rec.player.newsMultiplier > 1 ? "+" : ""}{Math.round((rec.player.newsMultiplier - 1) * 100)}% · {Math.round(rec.player.newsConfidence * 100)}% confidence</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="font-semibold text-text-primary mb-3">Your picks</h3>
          <ol className="space-y-1">
            {projectedPlan.map(({ pick, player }, index) => (
              <li key={pick.overall} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${pick.overall === myNext?.overall ? "ring-1 ring-border-accent" : ""}`}>
                <span className="font-mono text-xs text-text-dim w-10">{pick.round}.{String(pick.pickInRound).padStart(2, "0")}</span>
                {player ? <><span className="w-2 h-2 rounded-full" style={{ background: POS_COLOR[player.pos] }} /><span className={index < myTeam.length ? "text-text-primary" : "text-text-muted"}>{index < myTeam.length ? "✓ " : "proj "}{player.name}</span><span className="ml-auto font-mono text-xs text-text-dim">{player.pos}</span></> : <span className="text-text-dim">—</span>}
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex justify-between mb-3"><h3 className="font-semibold text-text-primary">Available players</h3><span className="font-mono text-xs text-text-muted">{available.length} left</span></div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…" aria-label="Search available players" className="w-full mb-3 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-accent" />
          <PositionFilter value={posFilter} onChange={setPosFilter} className="mb-3" />
          <ul className="space-y-1 max-h-[31rem] overflow-y-auto">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-surface-2/60">
                <span className="w-2 h-2 rounded-full" style={{ background: POS_COLOR[p.pos] }} /><span className="text-sm text-text-primary truncate">{p.name}</span><span className="font-mono text-xs text-text-dim">{p.pos}</span>
                <span className="font-mono text-xs text-text-muted ml-auto">ADP {p.adp} · VOR {p.adjustedVor}</span>
                <button onClick={() => markMine(p.id)} className="font-mono text-xs px-2 py-0.5 rounded border border-border text-accent-text hover:bg-accent hover:text-bg cursor-pointer">mine</button>
                <button onClick={() => markOther(p.id)} className="font-mono text-xs px-2 py-0.5 rounded border border-border text-text-muted hover:border-border-accent cursor-pointer">taken</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {Object.keys(taken).length > 0 && <div className="mt-4 flex flex-wrap gap-2"><span className="font-mono text-xs text-text-muted py-1">undo:</span>{Object.keys(taken).slice(-16).map((id) => { const p = byId.get(id); return p ? <button key={id} onClick={() => undo(id)} className="font-mono text-xs px-2 py-1 rounded-full border border-border text-text-muted hover:border-reach cursor-pointer">{p.name} ×</button> : null; })}</div>}
    </div>
  );
}
