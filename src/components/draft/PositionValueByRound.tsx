"use client";

import { useState } from "react";
import Dumbbell, { type DumbbellRow } from "./Dumbbell";
import { extent } from "./scale";
import { POSITIONS, POS_COLOR, type Position, type RoundPositionStat } from "@/data/draft-analysis";

type Metric = "mean" | "median";

function crossoverSummary(rows: { round: number; a: number; b: number }[], posA: Position, posB: Position) {
  if (!rows.length) return "";
  const segs: { w: Position; start: number; end: number }[] = [];
  for (const r of rows) {
    const w = r.b >= r.a ? posB : posA;
    const last = segs[segs.length - 1];
    if (last && last.w === w) last.end = r.round;
    else segs.push({ w, start: r.round, end: r.round });
  }
  if (segs.length === 1) return `${segs[0].w} holds the scoring edge every round shown.`;
  return segs
    .map((s) => `${s.w} leads ${s.start === s.end ? `Rd ${s.start}` : `Rds ${s.start}–${s.end}`}`)
    .join(" · ");
}

export default function PositionValueByRound({ stats }: { stats: RoundPositionStat[] }) {
  const [pair, setPair] = useState<[Position, Position]>(["WR", "RB"]);
  const [metric, setMetric] = useState<Metric>("mean");

  function pick(p: Position) {
    setPair(([, keep]) => (p === keep || p === pair[0] ? pair : [keep, p]));
  }

  const [posA, posB] = pair;
  const rows: DumbbellRow[] = stats
    .filter((s) => s[posA][metric] != null && s[posB][metric] != null)
    .map((s) => {
      const a = s[posA][metric] as number;
      const b = s[posB][metric] as number;
      return {
        key: `r${s.round}`,
        label: `Round ${s.round}`,
        a,
        b,
        lineColor: "var(--color-border-accent)",
        tooltip: (
          <div className="space-y-0.5 font-mono">
            <div className="text-text-primary">Round {s.round} · {metric}</div>
            <div style={{ color: POS_COLOR[posA] }}>{posA}: {Math.round(a)} ({s[posA].n} drafted)</div>
            <div style={{ color: POS_COLOR[posB] }}>{posB}: {Math.round(b)} ({s[posB].n} drafted)</div>
            <div className="text-text-muted">edge: {b - a >= 0 ? posB : posA} +{Math.abs(Math.round(b - a))}</div>
          </div>
        ),
      };
    });

  const [lo, hi] = extent(rows.flatMap((r) => [r.a, r.b]));
  const summary = crossoverSummary(rows.map((r) => ({ round: Number(r.key.slice(1)), a: r.a, b: r.b })), posA, posB);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="font-mono text-xs text-text-muted mr-1">compare:</span>
        {POSITIONS.map((p) => {
          const on = p === posA || p === posB;
          return (
            <button
              key={p}
              onClick={() => pick(p)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                on ? "text-bg border-transparent" : "bg-surface border-border text-text-muted hover:border-border-accent"
              }`}
              style={on ? { background: POS_COLOR[p] } : undefined}
            >
              {p}
            </button>
          );
        })}
        <span className="mx-1 text-text-dim">|</span>
        {(["mean", "median"] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              metric === m ? "bg-accent text-bg border-accent" : "bg-surface border-border text-text-muted hover:border-border-accent"
            }`}
          >
            {m === "mean" ? "average" : "median"}
          </button>
        ))}
      </div>

      {summary && (
        <p className="font-mono text-xs text-accent-text mb-4 bg-accent-dim/20 border border-border rounded-lg px-3 py-2">
          {summary}
        </p>
      )}

      {rows.length > 0 ? (
        <Dumbbell
          rows={rows}
          domain={[Math.min(0, lo), hi * 1.05]}
          aColor={POS_COLOR[posA]}
          bColor={POS_COLOR[posB]}
          aLabel={`${posA} ${metric} pts`}
          bLabel={`${posB} ${metric} pts`}
          axisLabel="proj. half-PPR pts"
          labelWidth={96}
        />
      ) : (
        <p className="font-mono text-xs text-text-muted">No overlapping rounds for {posA}/{posB}.</p>
      )}
    </div>
  );
}
