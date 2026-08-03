"use client";

import { useMemo, useState } from "react";
import PositionFilter from "./PositionFilter";
import { POSITIONS, POS_COLOR, type Position } from "@/data/draft-analysis";
import type { StrategyPlayer } from "@/lib/draft-strategy";

type PlayerValue = {
  player: StrategyPlayer;
  marketBaseline: number;
  priceEdge: number;
  priorityScore: number;
  label: "priority target" | "positional bargain" | "strong starter" | "fair value" | "bench depth" | "overpay";
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}`;

function classify(vor: number, edge: number): PlayerValue["label"] {
  if (vor <= 0) return "bench depth";
  if (edge <= -8) return "overpay";
  if (vor >= 20 && edge >= 8) return "priority target";
  if (edge >= 8) return "positional bargain";
  if (vor >= 20) return "strong starter";
  return "fair value";
}

const labelStyle: Record<PlayerValue["label"], string> = {
  "priority target": "text-steal border-steal/40 bg-steal/10",
  "positional bargain": "text-accent-text border-border-accent bg-accent-dim/20",
  "strong starter": "text-text-primary border-border-accent bg-surface-2",
  "fair value": "text-text-muted border-border bg-surface-2",
  "bench depth": "text-text-dim border-border bg-bg/40",
  overpay: "text-reach border-reach/40 bg-reach/10",
};

export default function ValueGapChart({ players, teams }: { players: StrategyPlayer[]; teams: number }) {
  const [pos, setPos] = useState<"All" | Position>("All");
  const [view, setView] = useState<"targets" | "overpays">("targets");

  const values = useMemo<PlayerValue[]>(() => players.map((player) => {
    const nearby = players.filter((other) => other.id !== player.id && Math.abs(other.adp - player.adp) <= teams * 0.6);
    const comparison = nearby.length >= 4 ? nearby : players.filter((other) => other.id !== player.id && Math.abs(other.adp - player.adp) <= teams);
    const marketBaseline = median(comparison.map((other) => other.adjustedVor));
    const priceEdge = player.adjustedVor - marketBaseline;
    const priorityScore = player.adjustedVor + Math.max(0, priceEdge) * 0.35;
    return { player, marketBaseline, priceEdge, priorityScore, label: classify(player.adjustedVor, priceEdge) };
  }), [players, teams]);

  const pool = pos === "All" ? values : values.filter((row) => row.player.pos === pos);
  const targets = [...pool]
    .filter((row) => row.player.adjustedVor > 0 && row.priceEdge >= -4)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 12);
  const overpays = [...pool]
    .filter((row) => row.priceEdge < -4 || row.player.adjustedVor <= 0)
    .sort((a, b) => a.priceEdge - b.priceEdge || a.player.adjustedVor - b.player.adjustedVor)
    .slice(0, 12);
  const shown = view === "targets" ? targets : overpays;
  const topCounts = POSITIONS.map((position) => ({ position, count: targets.filter((row) => row.player.pos === position).length }));
  const maxVor = Math.max(...shown.map((row) => Math.max(0, row.player.adjustedVor)), 1);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <PositionFilter value={pos} onChange={setPos} />
        <div className="flex gap-1 ml-auto" role="group" aria-label="Value view">
          <button onClick={() => setView("targets")} className={`font-mono text-xs px-3 py-1.5 rounded-full border cursor-pointer ${view === "targets" ? "bg-accent text-bg border-accent" : "border-border text-text-muted"}`}>Draft priorities</button>
          <button onClick={() => setView("overpays")} className={`font-mono text-xs px-3 py-1.5 rounded-full border cursor-pointer ${view === "overpays" ? "bg-reach text-white border-reach" : "border-border text-text-muted"}`}>Overpays & depth</button>
        </div>
      </div>

      {pos === "All" && view === "targets" && (
        <div className="flex flex-wrap gap-2 mb-4 font-mono text-xs text-text-muted">
          <span className="py-1">Top-12 priorities:</span>
          {topCounts.map(({ position, count }) => <span key={position} className="inline-flex items-center gap-1.5 border border-border rounded-full px-2 py-1"><span className="w-2 h-2 rounded-full" style={{ background: POS_COLOR[position] }} />{position} {count}</span>)}
        </div>
      )}

      <div className="space-y-2">
        {shown.map(({ player, marketBaseline, priceEdge, label }, index) => {
          const positive = player.adjustedVor > 0;
          return (
            <article key={player.id} className="relative overflow-hidden rounded-xl border border-border bg-surface-2/35 p-3 md:p-4">
              <span className="absolute inset-y-0 left-0 opacity-[0.08]" style={{ width: `${Math.max(2, (Math.max(0, player.adjustedVor) / maxVor) * 100)}%`, background: POS_COLOR[player.pos] }} />
              <div className="relative grid grid-cols-[auto_1fr] md:grid-cols-[2rem_minmax(13rem,1fr)_7rem_8rem_8rem] items-center gap-x-3 gap-y-2">
                <span className="font-mono text-xs text-text-dim">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: POS_COLOR[player.pos] }} /><strong className="text-text-primary truncate">{player.name}</strong><span className="font-mono text-xs text-text-dim">{player.pos} · {player.team} · Rd {player.adpRound}</span><span className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${labelStyle[label]}`}>{label}</span></div>
                  <p className="text-xs text-text-muted mt-1 ml-4">
                    {positive
                      ? `${player.adjustedVor.toFixed(1)} starter-value points; ${signed(priceEdge)} versus players normally drafted here.`
                      : `${player.adjustedVor.toFixed(1)} VOR is below replacement—even if the late ADP looks inexpensive.`}
                  </p>
                </div>
                <div className="font-mono text-xs md:text-right"><span className="text-text-dim md:block">ADP</span><span className="text-text-primary">{player.adp.toFixed(1)}</span></div>
                <div className="font-mono text-xs md:text-right"><span className="text-text-dim md:block">Starter value</span><span className={positive ? "text-text-primary" : "text-reach"}>{player.adjustedVor.toFixed(1)}</span></div>
                <div className="font-mono text-xs md:text-right"><span className="text-text-dim md:block">Price edge</span><span className={priceEdge >= 0 ? "text-steal" : "text-reach"}>{signed(priceEdge)}</span></div>
              </div>
              <span className="sr-only">Comparable players at this draft cost have median VOR {marketBaseline.toFixed(1)}.</span>
            </article>
          );
        })}
      </div>

      {shown.length === 0 && <p className="font-mono text-xs text-text-muted">No players meet this view&apos;s criteria for {pos}.</p>}

      <div className="grid md:grid-cols-3 gap-3 mt-5 text-xs text-text-muted">
        <p className="rounded-lg border border-border p-3"><strong className="text-text-primary">Starter value</strong><br />Projected points above this league&apos;s replacement player. Negative values are never called draft priorities.</p>
        <p className="rounded-lg border border-border p-3"><strong className="text-steal">Price edge</strong><br />VOR above or below players available in the same ADP window—not a misleading difference between rank numbers.</p>
        <p className="rounded-lg border border-border p-3"><strong className="text-accent-text">Priority score</strong><br />Rewards absolute lineup value first, then adds a smaller bonus for being underpriced. RB and WR FLEX value therefore remains central.</p>
      </div>
    </div>
  );
}
