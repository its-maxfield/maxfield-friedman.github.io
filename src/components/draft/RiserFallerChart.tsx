"use client";

import { useState } from "react";
import Dumbbell, { type DumbbellRow } from "./Dumbbell";
import PositionKey from "./PositionKey";
import PositionFilter from "./PositionFilter";
import { extent } from "./scale";
import { POS_COLOR, type DraftPlayer, type Position } from "@/data/draft-analysis";

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export default function RiserFallerChart({ players, perSide = 8 }: { players: DraftPlayer[]; perSide?: number }) {
  const [pos, setPos] = useState<"All" | Position>("All");
  const pool = pos === "All" ? players : players.filter((p) => p.pos === pos);

  const movers = pool
    .filter((p) => p.lastPts != null)
    .map((p) => ({ p, delta: p.projPts - (p.lastPts as number) }));
  movers.sort((a, b) => b.delta - a.delta);
  const shown = [...movers.slice(0, perSide), ...movers.slice(-perSide).reverse()].filter(
    (m, i, a) => a.indexOf(m) === i,
  );

  const rows: DumbbellRow[] = shown.map(({ p, delta }) => {
    const up = delta >= 0;
    return {
      key: p.id,
      label: p.name,
      sub: `${p.pos} · ${p.team}`,
      a: p.lastPts as number,
      b: p.projPts,
      aColor: "var(--color-text-muted)",
      bColor: POS_COLOR[p.pos],
      lineColor: up ? "var(--color-steal)" : "var(--color-reach)",
      highlight: p.teamChanged,
      badge: p.teamChanged ? `↔ ${p.priorTeam}→${p.team}` : signed(Math.round(delta)),
      tooltip: (
        <div className="space-y-0.5 font-mono">
          <div className="text-text-primary">{p.name} · {p.pos} {p.team}</div>
          <div className="text-text-muted">2025 actual: {Math.round(p.lastPts as number)}</div>
          <div style={{ color: POS_COLOR[p.pos] }}>2026 proj: {Math.round(p.projPts)}</div>
          <div style={{ color: up ? "var(--color-steal)" : "var(--color-reach)" }}>{signed(Math.round(delta))} pts</div>
          {p.teamChanged && <div className="text-accent-text">changed teams: {p.priorTeam} → {p.team}</div>}
        </div>
      ),
    };
  });

  const [lo, hi] = extent(rows.flatMap((r) => [r.a, r.b]));

  return (
    <div>
      <PositionFilter value={pos} onChange={setPos} className="mb-3" />
      <div className="flex flex-col gap-1.5 mb-3 font-mono text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-text-muted)" }} />
            2025 actual
          </span>
          <PositionKey label="2026 proj, by position:" />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: "var(--color-steal)" }} />rising into 2026
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: "var(--color-reach)" }} />falling
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-text-muted" />ringed = changed teams
          </span>
        </div>
      </div>
      {rows.length > 0 ? (
        <Dumbbell
          rows={rows}
          domain={[Math.min(0, lo), hi * 1.05]}
          showLegend={false}
          aColor="var(--color-text-muted)"
          bColor="var(--color-accent)"
          aLabel="2025 actual pts"
          bLabel="2026 projected pts"
          axisLabel="half-PPR pts"
        />
      ) : (
        <p className="font-mono text-xs text-text-muted">No prior-season movers for {pos}.</p>
      )}
    </div>
  );
}
