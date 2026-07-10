"use client";

import type { DraftPlayer } from "@/data/draft-analysis";

interface Tile {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function Card({ t }: { t: Tile }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <div className="font-mono text-xs text-text-muted mb-1">{t.label}</div>
      <div className="text-xl font-semibold text-text-primary leading-tight" style={t.color ? { color: t.color } : undefined}>
        {t.value}
      </div>
      {t.sub && <div className="font-mono text-xs text-text-muted mt-0.5 truncate">{t.sub}</div>}
    </div>
  );
}

export default function StatTiles({ players }: { players: DraftPlayer[] }) {
  const byGap = [...players].sort((a, b) => b.valueGap - a.valueGap);
  const steal = byGap[0];
  const reach = byGap[byGap.length - 1];
  const movers = players.filter((p) => p.lastPts != null).map((p) => ({ p, d: p.projPts - (p.lastPts as number) }));
  const riser = [...movers].sort((a, b) => b.d - a.d)[0];
  const faller = [...movers].sort((a, b) => a.d - b.d)[0];
  const changers = players.filter((p) => p.teamChanged).length;

  const tiles: Tile[] = [
    { label: "players analyzed", value: String(players.length) },
    { label: "biggest steal", value: steal.name, sub: `${steal.pos} · +${steal.valueGap} vs ADP`, color: "var(--color-steal)" },
    { label: "biggest reach", value: reach.name, sub: `${reach.pos} · ${reach.valueGap} vs ADP`, color: "var(--color-reach)" },
    { label: "top riser", value: riser.p.name, sub: `${riser.p.pos} · +${Math.round(riser.d)} pts`, color: "var(--color-steal)" },
    { label: "top faller", value: faller.p.name, sub: `${faller.p.pos} · ${Math.round(faller.d)} pts`, color: "var(--color-reach)" },
    { label: "changed teams", value: String(changers), sub: "flagged in charts" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tiles.map((t) => (
        <Card key={t.label} t={t} />
      ))}
    </div>
  );
}
