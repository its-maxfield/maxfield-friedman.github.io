"use client";

import { POSITIONS, type LeagueConfig, type Position, type RiskMode, type ScoringFormat } from "@/data/draft-analysis";

interface Props {
  value: LeagueConfig;
  onChange: (value: LeagueConfig) => void;
}

const fieldClass = "bg-surface-2 border border-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-accent";

export default function LeagueSettings({ value, onChange }: Props) {
  const patch = (next: Partial<LeagueConfig>) => onChange({ ...value, ...next });
  const starter = (pos: Position, count: number) => patch({ starters: { ...value.starters, [pos]: count } });

  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h2 className="font-bold text-text-primary">League model</h2>
          <p className="text-sm text-text-muted">Every setting immediately recalculates points, scarcity, and recommendations.</p>
        </div>
        <span className="font-mono text-xs text-accent-text">saved on this device</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <label className="text-xs text-text-muted">Teams
          <select aria-label="League teams" value={value.teams} onChange={(e) => patch({ teams: Number(e.target.value) })} className={`${fieldClass} mt-1 w-full`}>
            {[8, 10, 12, 14].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs text-text-muted">Scoring
          <select aria-label="Reception scoring" value={value.scoring} onChange={(e) => patch({ scoring: e.target.value as ScoringFormat })} className={`${fieldClass} mt-1 w-full`}>
            <option value="standard">Standard</option><option value="half_ppr">Half PPR</option><option value="ppr">Full PPR</option>
          </select>
        </label>
        <label className="text-xs text-text-muted">Pass TD
          <select aria-label="Passing touchdown points" value={value.passTd} onChange={(e) => patch({ passTd: Number(e.target.value) as 4 | 6 })} className={`${fieldClass} mt-1 w-full`}>
            <option value={4}>4 points</option><option value={6}>6 points</option>
          </select>
        </label>
        <label className="text-xs text-text-muted">Draft slot
          <select aria-label="Draft slot" value={Math.min(value.draftSlot, value.teams)} onChange={(e) => patch({ draftSlot: Number(e.target.value) })} className={`${fieldClass} mt-1 w-full`}>
            {Array.from({ length: value.teams }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        {POSITIONS.map((pos) => (
          <label key={pos} className="text-xs text-text-muted">Start {pos}
            <select aria-label={`${pos} starters`} value={value.starters[pos]} onChange={(e) => starter(pos, Number(e.target.value))} className={`${fieldClass} mt-1 w-full`}>
              {(pos === "QB" || pos === "TE" ? [1, 2] : [1, 2, 3, 4]).map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
        ))}
        <label className="text-xs text-text-muted">FLEX
          <select aria-label="Flex starters" value={value.flex} onChange={(e) => patch({ flex: Number(e.target.value) })} className={`${fieldClass} mt-1 w-full`}>
            {[0, 1, 2].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs text-text-muted">Bench
          <select aria-label="Bench spots" value={value.bench} onChange={(e) => patch({ bench: Number(e.target.value) })} className={`${fieldClass} mt-1 w-full`}>
            {[4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs text-text-muted">IR
          <select aria-label="IR spots" value={value.ir} onChange={(e) => patch({ ir: Number(e.target.value) })} className={`${fieldClass} mt-1 w-full`}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs text-text-muted col-span-2">Risk preference
          <select aria-label="Risk preference" value={value.riskMode} onChange={(e) => patch({ riskMode: e.target.value as RiskMode })} className={`${fieldClass} mt-1 w-full`}>
            <option value="conservative">Conservative</option><option value="balanced">Balanced</option><option value="upside">Upside</option>
          </select>
        </label>
      </div>
    </div>
  );
}
