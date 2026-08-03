"use client";

import { useMemo, useState } from "react";
import { POSITIONS, POS_COLOR, type LeagueConfig } from "@/data/draft-analysis";
import { roundStrategy, type OpportunityStatus, type StrategyPlayer } from "@/lib/draft-strategy";

const statusStyle: Record<OpportunityStatus, string> = {
  "draft now": "text-reach border-reach/40 bg-reach/10",
  "lean now": "text-amber-400 border-amber-700/50 bg-amber-950/20",
  "can wait": "text-steal border-steal/40 bg-steal/10",
  "replacement only": "text-text-dim border-border bg-surface-2",
};

export default function RoundStrategy({ players, config }: { players: StrategyPlayer[]; config: LeagueConfig }) {
  const rows = useMemo(() => roundStrategy(players, config), [players, config]);
  const [selectedRound, setSelectedRound] = useState(1);
  const selected = rows.find((row) => row.round === selectedRound) ?? rows[0];
  if (!selected) return null;

  const best = selected.best;
  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" aria-label="Select draft round">
        {rows.map((row) => (
          <button key={row.round} onClick={() => setSelectedRound(row.round)} className={`shrink-0 font-mono text-xs min-w-10 h-9 rounded-lg border cursor-pointer ${row.round === selected.round ? "bg-accent text-bg border-accent" : "bg-surface-2 text-text-muted border-border hover:border-border-accent"}`} aria-pressed={row.round === selected.round}>
            R{row.round}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border-accent bg-accent-dim/15 p-4 mb-4">
        <div className="font-mono text-xs text-accent-text mb-1">YOUR PICK · R{selected.round}.{String(selected.pickInRound).padStart(2, "0")} · OVERALL #{selected.overall}</div>
        {best.target ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2 py-1 rounded-full text-bg" style={{ background: POS_COLOR[best.pos] }}>{best.pos}</span>
              <h3 className="text-lg font-semibold text-text-primary">Prioritize {best.target.name}</h3>
              <span className={`font-mono text-xs px-2 py-1 rounded-full border ${statusStyle[best.status]}`}>{best.status}</span>
            </div>
            <p className="text-sm text-text-muted mt-2 max-w-3xl">
              {best.target.name} carries {best.target.adjustedVor.toFixed(1)} points above replacement.
              {selected.nextOverall ? ` There is a ${Math.round(best.survivalToNext * 100)}% chance that target reaches your next pick at #${selected.nextOverall}. Waiting costs an estimated ${best.dropoff.toFixed(1)} VOR points` : " This is your final modeled pick"}
              {best.fallback ? `, with ${best.fallback.name} as the likely fallback.` : "."}
            </p>
          </>
        ) : <p className="text-text-muted">No reliable target at this pick.</p>}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {POSITIONS.map((pos) => {
          const item = selected.positions.find((row) => row.pos === pos)!;
          const target = item.target;
          const retained = target && target.adjustedVor > 0 ? Math.max(0, Math.min(100, (item.waitValue / target.adjustedVor) * 100)) : 0;
          return (
            <article key={pos} className={`rounded-xl border p-4 ${item.pos === best.pos ? "border-border-accent bg-surface-2/70" : "border-border bg-surface"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs px-2 py-1 rounded-full text-bg" style={{ background: POS_COLOR[pos] }}>{pos}</span>
                <span className={`font-mono text-[11px] px-2 py-1 rounded-full border ${statusStyle[item.status]}`}>{item.status}</span>
              </div>
              {target ? <>
                <div className="text-text-primary font-semibold truncate">{target.name}</div>
                <div className="font-mono text-xs text-text-muted mt-1">ADP {target.adp.toFixed(1)} · VOR {target.adjustedVor.toFixed(1)}</div>
                <div className="mt-4">
                  <div className="flex justify-between font-mono text-[11px] text-text-muted mb-1"><span>value retained if you wait</span><span>{Math.round(retained)}%</span></div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${retained}%`, background: POS_COLOR[pos] }} /></div>
                </div>
                <dl className="grid grid-cols-2 gap-2 mt-4 font-mono text-xs">
                  <div><dt className="text-text-dim">Survives</dt><dd className="text-text-primary">{Math.round(item.survivalToNext * 100)}%</dd></div>
                  <div><dt className="text-text-dim">Cost to wait</dt><dd className={item.dropoff >= 8 ? "text-reach" : "text-text-primary"}>{item.dropoff.toFixed(1)}</dd></div>
                </dl>
                <p className="text-xs text-text-dim mt-3">{item.fallback ? `Next fallback: ${item.fallback.name}` : "No later fallback modeled."}</p>
              </> : <p className="text-sm text-text-muted">No reliable option.</p>}
            </article>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4 text-xs text-text-muted">
        <p className="rounded-lg border border-border p-3"><strong className="text-reach">Draft now</strong><br />A strong option is unlikely to survive, and the next fallback loses meaningful value.</p>
        <p className="rounded-lg border border-border p-3"><strong className="text-steal">Can wait</strong><br />The same player or a comparable alternative is likely to remain at your next pick.</p>
        <p className="rounded-lg border border-border p-3"><strong className="text-text-primary">Use roster context</strong><br />The priority assumes you still need that position. Your live assistant accounts for players already drafted.</p>
      </div>
    </div>
  );
}
