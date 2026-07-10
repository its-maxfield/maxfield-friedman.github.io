"use client";

import { useState, useMemo } from "react";
import PositionFilter from "./PositionFilter";
import { POS_COLOR, type DraftPlayer, type Position } from "@/data/draft-analysis";

const RISK_COLOR: Record<string, string> = {
  high: "var(--color-reach)",
  med: "#c98500",
  low: "var(--color-text-dim)",
};

type SortKey = "adp" | "projPts" | "vor" | "valueGap" | "lastPts";
const COLS: { key: SortKey; label: string }[] = [
  { key: "adp", label: "ADP" },
  { key: "projPts", label: "Proj" },
  { key: "lastPts", label: "2025" },
  { key: "vor", label: "VOR" },
  { key: "valueGap", label: "Value" },
];

const num = (v: number | null) => (v == null ? "—" : v % 1 === 0 ? String(v) : v.toFixed(1));
const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export default function DraftBoard({ players }: { players: DraftPlayer[] }) {
  const [pos, setPos] = useState<"All" | Position>("All");
  const [sort, setSort] = useState<SortKey>("adp");

  const rows = useMemo(() => {
    const filtered = pos === "All" ? players : players.filter((p) => p.pos === pos);
    const dir = sort === "adp" ? 1 : -1; // adp ascending is "best first"; others descending
    return [...filtered].sort((a, b) => {
      const av = a[sort] ?? (dir === 1 ? Infinity : -Infinity);
      const bv = b[sort] ?? (dir === 1 ? Infinity : -Infinity);
      return (av === bv ? a.adp - b.adp : (av as number) - (bv as number)) * dir;
    });
  }, [players, pos, sort]);

  return (
    <div>
      <PositionFilter value={pos} onChange={setPos} className="mb-4" />

      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr className="text-text-muted font-mono text-xs border-b border-border">
              <th className="text-left font-normal py-2 px-3">#</th>
              <th className="text-left font-normal py-2 px-3">Player</th>
              <th className="text-left font-normal py-2 px-3">Rd</th>
              {COLS.map((c) => (
                <th key={c.key} className="text-right font-normal py-2 px-3">
                  <button
                    onClick={() => setSort(c.key)}
                    className={`cursor-pointer hover:text-text-primary transition-colors ${sort === c.key ? "text-accent-text" : ""}`}
                  >
                    {c.label}
                    {sort === c.key ? " ↓" : ""}
                  </button>
                </th>
              ))}
              <th className="text-center font-normal py-2 px-3">Tier</th>
              <th className="text-center font-normal py-2 px-3">Risk</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((p, i) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                <td className="py-2 px-3 text-text-dim tabular-nums">{i + 1}</td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: POS_COLOR[p.pos] }} />
                    <span className="text-text-primary">{p.name}</span>
                    <span className="text-text-dim text-xs">{p.pos} · {p.team}</span>
                    {p.teamChanged && <span className="text-accent-text text-xs">↔{p.priorTeam}</span>}
                    {p.injuryStatus && (
                      <span className="text-xs" style={{ color: "var(--color-reach)" }}>{p.injuryStatus}</span>
                    )}
                  </span>
                </td>
                <td className="py-2 px-3 text-text-muted tabular-nums">{p.adpRound}</td>
                <td className="py-2 px-3 text-right text-text-muted tabular-nums">{p.adp.toFixed(1)}</td>
                <td className="py-2 px-3 text-right text-text-primary tabular-nums">{num(p.projPts)}</td>
                <td className="py-2 px-3 text-right text-text-muted tabular-nums">{num(p.lastPts)}</td>
                <td className="py-2 px-3 text-right text-text-muted tabular-nums">{num(p.vor)}</td>
                <td
                  className="py-2 px-3 text-right tabular-nums"
                  style={{ color: p.valueGap > 0 ? "var(--color-steal)" : p.valueGap < 0 ? "var(--color-reach)" : undefined }}
                >
                  {signed(p.valueGap)}
                </td>
                <td className="py-2 px-3 text-center text-text-muted tabular-nums">{p.tier}</td>
                <td className="py-2 px-3 text-center" title={`bust score ${p.bustScore}/100`}>
                  <span style={{ color: RISK_COLOR[p.bustRisk] }}>{p.bustRisk}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-xs text-text-dim mt-2">
        Value = how many draft slots earlier/later a player goes vs. their VOR rank. <span style={{ color: "var(--color-steal)" }}>green = steal</span>, <span style={{ color: "var(--color-reach)" }}>red = reach</span>.
      </p>
    </div>
  );
}
