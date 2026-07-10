"use client";

import { useState } from "react";
import Dumbbell, { type DumbbellRow } from "./Dumbbell";
import PositionKey from "./PositionKey";
import PositionFilter from "./PositionFilter";
import { POS_COLOR, type DraftPlayer, type Position } from "@/data/draft-analysis";

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export default function ValueGapChart({ players, perSide = 8 }: { players: DraftPlayer[]; perSide?: number }) {
  const [pos, setPos] = useState<"All" | Position>("All");
  const pool = pos === "All" ? players : players.filter((p) => p.pos === pos);

  const byGap = [...pool].sort((a, b) => b.valueGap - a.valueGap);
  const steals = byGap.slice(0, perSide);
  const reaches = byGap.slice(-perSide).reverse();
  const shown = [...steals, ...reaches].filter((p, i, a) => a.indexOf(p) === i);

  const maxRank = Math.max(...shown.flatMap((p) => [p.adpOvrRank, p.vorOvrRank]), 2);

  const rows: DumbbellRow[] = shown.map((p) => {
    const steal = p.valueGap > 0;
    const risky = p.bustRisk === "high";
    return {
      key: p.id,
      label: p.name,
      sub: `${p.pos} · ${p.team}${risky ? " · ⚠ bust risk" : ""}`,
      a: p.adpOvrRank,
      b: p.vorOvrRank,
      aColor: "var(--color-text-muted)",
      bColor: POS_COLOR[p.pos],
      lineColor: steal ? "var(--color-steal)" : "var(--color-reach)",
      highlight: risky,
      badge: `${steal ? "▲" : "▼"}${signed(p.valueGap)}`,
      tooltip: (
        <div className="space-y-0.5 font-mono">
          <div className="text-text-primary">{p.name} · {p.pos} {p.team}</div>
          <div className="text-text-muted">drafted: #{p.adpOvrRank} (rd {p.adpRound})</div>
          <div style={{ color: POS_COLOR[p.pos] }}>value (VOR): #{p.vorOvrRank}</div>
          <div style={{ color: steal ? "var(--color-steal)" : "var(--color-reach)" }}>
            {steal ? "steal" : "reach"} {signed(p.valueGap)} spots
          </div>
          <div className="text-text-muted">bust risk: {p.bustRisk} ({p.bustScore})</div>
        </div>
      ),
    };
  });

  return (
    <div>
      <PositionFilter value={pos} onChange={setPos} className="mb-3" />
      <div className="flex flex-col gap-1.5 mb-3 font-mono text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-text-muted)" }} />
            drafted at (ADP)
          </span>
          <PositionKey label="worth (VOR), by position:" />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: "var(--color-steal)" }} />▲ steal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: "var(--color-reach)" }} />▼ reach
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-text-muted" />⚠ ringed = high bust risk
          </span>
        </div>
      </div>
      {rows.length > 0 ? (
        <Dumbbell
          rows={rows}
          domain={[1, maxRank]}
          invert
          showLegend={false}
          aColor="var(--color-text-muted)"
          bColor="var(--color-accent)"
          aLabel="drafted at (ADP rank)"
          bLabel="worth (VOR rank)"
          axisLabel="← better  ·  overall rank"
          valueFmt={(n) => `#${Math.round(n)}`}
        />
      ) : (
        <p className="font-mono text-xs text-text-muted">No players for {pos}.</p>
      )}
    </div>
  );
}
