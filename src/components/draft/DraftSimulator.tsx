"use client";

import { useState, useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import PositionFilter from "./PositionFilter";
import { POS_COLOR, type DraftPlayer, type DraftMeta, type Position } from "@/data/draft-analysis";

const KEY = "draft_sim_v1";
// Starting-lineup needs (fill these first, by VOR) then best-available up to the cap.
const STARTERS: Record<Position, number> = { QB: 1, RB: 2, WR: 2, TE: 1 };
const ROSTER_CAP: Record<Position, number> = { QB: 2, RB: 6, WR: 6, TE: 2 };

// Best pick from a VOR-sorted pool: fill an open starter slot first, else best available under cap.
function pickBest(pool: DraftPlayer[], posCount: Record<Position, number>): DraftPlayer | null {
  if (!pool.length) return null;
  const needStarter = pool.find((p) => posCount[p.pos] < STARTERS[p.pos]);
  if (needStarter) return needStarter;
  return pool.find((p) => posCount[p.pos] < ROSTER_CAP[p.pos]) ?? pool[0];
}

interface SimState {
  slot: number;
  taken: Record<string, "me" | "other">;
  mine: string[]; // ordered list of my picks
}

interface SnakePick {
  round: number;
  overall: number;
  pickInRound: number;
}

function snakePicks(teams: number, rounds: number, slot: number): SnakePick[] {
  const picks: SnakePick[] = [];
  for (let r = 1; r <= rounds; r++) {
    const odd = r % 2 === 1;
    picks.push({
      round: r,
      overall: odd ? (r - 1) * teams + slot : r * teams - slot + 1,
      pickInRound: odd ? slot : teams - slot + 1,
    });
  }
  return picks;
}

interface PlanRow extends SnakePick {
  player: DraftPlayer | null;
  projected: boolean;
}

/** Fill each of my picks: made picks use my actual selection, future picks project the
 *  best-available (VOR, capped by position) after simulating others taking earliest ADPs. */
function buildPlan(
  myPicks: SnakePick[],
  mine: DraftPlayer[],
  available: DraftPlayer[],
  currentOverall: number,
): PlanRow[] {
  const plan: PlanRow[] = myPicks.slice(0, mine.length).map((mp, i) => ({ ...mp, player: mine[i], projected: false }));

  const pool = [...available]; // already sorted by VOR desc, excludes taken
  const posCount: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  mine.forEach((p) => (posCount[p.pos] += 1));
  let cursor = currentOverall;

  for (const mp of myPicks.slice(mine.length)) {
    const others = Math.max(0, mp.overall - cursor);
    if (others > 0) {
      const gone = new Set([...pool].sort((a, b) => a.adpOvrRank - b.adpOvrRank).slice(0, others).map((p) => p.id));
      for (let i = pool.length - 1; i >= 0; i--) if (gone.has(pool[i].id)) pool.splice(i, 1);
    }
    const pick = pickBest(pool, posCount);
    plan.push({ ...mp, player: pick, projected: true });
    if (pick) {
      posCount[pick.pos] += 1;
      pool.splice(pool.findIndex((p) => p.id === pick.id), 1);
    }
    cursor = mp.overall + 1;
  }
  return plan;
}

export default function DraftSimulator({ players, meta }: { players: DraftPlayer[]; meta: DraftMeta }) {
  const [state, setState] = useState<SimState>(() => {
    if (typeof window === "undefined") return { slot: 1, taken: {}, mine: [] };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s.slot === "number" && s.taken && Array.isArray(s.mine)) return s;
    } catch {}
    return { slot: 1, taken: {}, mine: [] };
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const { slot, taken, mine } = state;
  const [posFilter, setPosFilter] = useState<"All" | Position>("All");
  const [query, setQuery] = useState("");

  const { teams, rounds } = meta;
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const myPicks = useMemo(() => snakePicks(teams, rounds, slot), [teams, rounds, slot]);

  const currentOverall = Object.keys(taken).length + 1;
  const myNext = myPicks.find((p) => p.overall >= currentOverall) ?? null;

  const available = useMemo(
    () => players.filter((p) => !taken[p.id]).sort((a, b) => b.vor - a.vor),
    [players, taken],
  );
  const myTeam = useMemo(() => mine.map((id) => byId.get(id)).filter(Boolean) as DraftPlayer[], [mine, byId]);
  const plan = useMemo(
    () => buildPlan(myPicks, myTeam, available, currentOverall),
    [myPicks, myTeam, available, currentOverall],
  );

  const recommendation = plan.find((r) => r.projected)?.player ?? null;
  const bestOnBoard = available[0] ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available
      .filter((p) => (posFilter === "All" || p.pos === posFilter) && (!q || p.name.toLowerCase().includes(q)))
      .slice(0, 60);
  }, [available, posFilter, query]);

  const maxVor = Math.max(...players.map((p) => p.vor), 1);

  const markMine = (id: string) => setState((s) => ({ ...s, taken: { ...s.taken, [id]: "me" }, mine: [...s.mine, id] }));
  const markOther = (id: string) => setState((s) => ({ ...s, taken: { ...s.taken, [id]: "other" }, mine: s.mine.filter((x) => x !== id) }));
  const undo = (id: string) =>
    setState((s) => {
      const t = { ...s.taken };
      delete t[id];
      return { ...s, taken: t, mine: s.mine.filter((x) => x !== id) };
    });
  const reset = () => setState((s) => ({ ...s, taken: {}, mine: [] }));

  return (
    <div>
      {/* Slot + status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        <span className="font-mono text-xs text-text-muted">your slot:</span>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: teams }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setState((s) => ({ ...s, slot: n }))}
              className={`font-mono text-xs w-8 h-8 rounded-lg border transition-colors cursor-pointer ${
                slot === n ? "bg-accent text-bg border-accent" : "bg-surface border-border text-text-muted hover:border-border-accent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-full border border-border text-text-muted hover:border-border-accent transition-colors cursor-pointer"
        >
          <RotateCcw size={13} /> reset draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: your draft plan */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-semibold text-text-primary">Your draft plan</h3>
            <span className="font-mono text-xs text-text-muted">
              {myNext ? `on the clock: overall #${currentOverall} · your next #${myNext.overall}` : "draft complete"}
            </span>
          </div>

          {(recommendation || bestOnBoard) && myNext && (
            <div className="mb-3 rounded-lg border border-border-accent bg-accent-dim/20 px-3 py-2">
              <div className="font-mono text-xs text-accent-text mb-0.5">
                recommended at your pick (R{myNext.round}.{String(myNext.pickInRound).padStart(2, "0")})
              </div>
              {recommendation ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: POS_COLOR[recommendation.pos] }} />
                  <span className="text-text-primary font-semibold">{recommendation.name}</span>
                  <span className="font-mono text-xs text-text-muted">
                    {recommendation.pos} · VOR {recommendation.vor} · ADP {recommendation.adp}
                  </span>
                </div>
              ) : (
                <div className="text-text-muted text-sm">No projection available.</div>
              )}
              {bestOnBoard && recommendation && bestOnBoard.id !== recommendation.id && (
                <div className="font-mono text-xs text-text-muted mt-1">
                  best on board now: {bestOnBoard.name} ({bestOnBoard.pos}, VOR {bestOnBoard.vor}) — may not last to your pick
                </div>
              )}
            </div>
          )}

          <ol className="space-y-1">
            {plan.map((row) => (
              <li
                key={row.overall}
                className={`relative flex items-center gap-2 rounded-md px-2 py-1.5 overflow-hidden ${
                  row.overall === myNext?.overall ? "ring-1 ring-border-accent" : ""
                }`}
              >
                {/* VOR bar */}
                {row.player && (
                  <span
                    className="absolute inset-y-0 left-0 opacity-10"
                    style={{ width: `${Math.max(4, (Math.max(row.player.vor, 0) / maxVor) * 100)}%`, background: POS_COLOR[row.player.pos] }}
                  />
                )}
                <span className="relative font-mono text-xs text-text-dim w-10 shrink-0">
                  {row.round}.{String(row.pickInRound).padStart(2, "0")}
                </span>
                {row.player ? (
                  <>
                    <span className="relative inline-block w-2 h-2 rounded-full shrink-0" style={{ background: POS_COLOR[row.player.pos] }} />
                    <span className={`relative text-sm truncate ${row.projected ? "text-text-muted" : "text-text-primary"}`}>
                      {row.projected ? "" : "✓ "}
                      {row.player.name}
                    </span>
                    <span className="relative font-mono text-xs text-text-dim ml-auto shrink-0">
                      {row.player.pos} · {row.projected ? "proj" : "yours"}
                    </span>
                  </>
                ) : (
                  <span className="relative text-sm text-text-dim">—</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* RIGHT: available players */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-semibold text-text-primary">Available players</h3>
            <span className="font-mono text-xs text-text-muted">{available.length} left</span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players…"
            className="w-full mb-3 px-3 py-2 bg-surface-2 border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-accent"
          />
          <PositionFilter value={posFilter} onChange={setPosFilter} className="mb-3" />
          <div className="max-h-[28rem] overflow-y-auto -mx-1 px-1">
            <ul className="space-y-1">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2/60">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: POS_COLOR[p.pos] }} />
                  <span className="text-sm text-text-primary truncate">{p.name}</span>
                  <span className="font-mono text-xs text-text-dim shrink-0">{p.pos}</span>
                  {p.bustRisk === "high" && <span className="font-mono text-xs" style={{ color: "var(--color-reach)" }}>⚠</span>}
                  <span className="font-mono text-xs text-text-muted ml-auto shrink-0 tabular-nums">
                    ADP {p.adp} · VOR {p.vor}
                  </span>
                  <button
                    onClick={() => markMine(p.id)}
                    className="font-mono text-xs px-2 py-0.5 rounded border border-border text-accent-text hover:bg-accent hover:text-bg transition-colors cursor-pointer shrink-0"
                    title="I drafted this player"
                  >
                    ✓ mine
                  </button>
                  <button
                    onClick={() => markOther(p.id)}
                    className="font-mono text-xs px-2 py-0.5 rounded border border-border text-text-muted hover:border-border-accent transition-colors cursor-pointer shrink-0"
                    title="Drafted by another team"
                  >
                    taken
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="font-mono text-xs text-text-muted px-2 py-2">No available players match.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Recently marked (undo) */}
      {Object.keys(taken).length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-muted">off the board:</span>
          {Object.keys(taken)
            .slice(-16)
            .map((id) => {
              const p = byId.get(id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  onClick={() => undo(id)}
                  className={`font-mono text-xs px-2 py-1 rounded-full border transition-colors cursor-pointer hover:border-reach ${
                    taken[id] === "me" ? "border-accent text-accent-text" : "border-border text-text-dim"
                  }`}
                  title="Click to undo"
                >
                  {taken[id] === "me" ? "✓ " : ""}
                  {p.name} ✕
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
