"use client";

import { useMemo, useState } from "react";
import PositionFilter from "./PositionFilter";
import { POS_COLOR, type Position } from "@/data/draft-analysis";
import type { StrategyPlayer } from "@/lib/draft-strategy";

type SortKey = "adp" | "adjustedProjPts" | "adjustedVor" | "valueGap" | "adjustedRank" | "momentumScore";
const columns: Array<{ key: SortKey; label: string; asc?: boolean }> = [
  { key: "adp", label: "ADP", asc: true }, { key: "adjustedRank", label: "Rank", asc: true },
  { key: "adjustedProjPts", label: "Adj pts" }, { key: "adjustedVor", label: "VOR" },
  { key: "valueGap", label: "Value" }, { key: "momentumScore", label: "News" },
];
const signed = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}`;

export default function DraftBoard({ players }: { players: StrategyPlayer[] }) {
  const [pos, setPos] = useState<"All" | Position>("All");
  const [sort, setSort] = useState<SortKey>("adjustedRank");
  const rows = useMemo(() => {
    const filtered = pos === "All" ? players : players.filter((p) => p.pos === pos);
    const col = columns.find((c) => c.key === sort);
    return [...filtered].sort((a, b) => ((a[sort] ?? 0) - (b[sort] ?? 0)) * (col?.asc ? 1 : -1));
  }, [players, pos, sort]);

  return (
    <div>
      <PositionFilter value={pos} onChange={setPos} className="mb-4" />
      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-sm min-w-[900px]">
          <thead><tr className="font-mono text-xs text-text-muted border-b border-border">
            <th className="text-left font-normal p-3">Player</th><th className="text-left font-normal p-3">Rd</th>
            {columns.map((c) => <th key={c.key} className="text-right font-normal p-3"><button onClick={() => setSort(c.key)} className={`hover:text-text-primary cursor-pointer ${sort === c.key ? "text-accent-text" : ""}`}>{c.label}{sort === c.key ? " ↓" : ""}</button></th>)}
            <th className="text-center font-normal p-3">Risk</th>
          </tr></thead>
          <tbody className="font-mono">
            {rows.map((p) => {
              const delta = p.adjustedProjPts - p.baselineProjPts;
              return <tr key={p.id} className="border-b border-border/50 hover:bg-surface-2/50">
                <td className="p-3"><span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: POS_COLOR[p.pos] }} /><span className="text-text-primary">{p.name}</span><span className="text-text-dim text-xs">{p.pos} · {p.team}</span>{p.teamChanged && <span className="text-accent-text text-xs">{p.priorTeam}→{p.team}</span>}{p.injuryStatus && <span className="text-reach text-xs">{p.injuryStatus}</span>}</span>
                  {delta !== 0 && <div className="text-[11px] text-text-dim mt-0.5 ml-4">baseline {p.baselineProjPts} · news/risk {signed(delta)} pts · {Math.round(p.newsConfidence * 100)}% conf.</div>}
                </td>
                <td className="p-3 text-text-muted">{p.adpRound}</td>
                <td className="p-3 text-right text-text-muted">{p.adp.toFixed(1)}</td><td className="p-3 text-right text-text-primary">#{p.adjustedRank}</td>
                <td className="p-3 text-right text-text-primary">{p.adjustedProjPts.toFixed(1)}</td><td className="p-3 text-right text-text-muted">{p.adjustedVor.toFixed(1)}</td>
                <td className="p-3 text-right" style={{ color: p.valueGap > 0 ? "var(--color-steal)" : p.valueGap < 0 ? "var(--color-reach)" : undefined }}>{signed(p.valueGap)}</td>
                <td className="p-3 text-right" style={{ color: p.momentumScore > 0 ? "var(--color-steal)" : p.momentumScore < 0 ? "var(--color-reach)" : undefined }}>{signed(p.momentumScore)}</td>
                <td className="p-3 text-center text-text-muted" title={`Bust score ${p.bustScore}/100`}>{p.bustRisk}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-xs text-text-dim mt-2">Value compares adjusted league rank with market ADP. Baseline and cited news impact remain visible for every changed player.</p>
    </div>
  );
}
