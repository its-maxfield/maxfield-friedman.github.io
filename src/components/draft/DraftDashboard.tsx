"use client";

import { useMemo, useSyncExternalStore } from "react";
import SectionWrapper from "@/components/ui/SectionWrapper";
import StatTiles from "./StatTiles";
import ValueGapChart from "./ValueGapChart";
import RiserFallerChart from "./RiserFallerChart";
import IRStashTargets from "./IRStashTargets";
import DraftBoard from "./DraftBoard";
import DraftSimulator from "./DraftSimulator";
import LeagueSettings from "./LeagueSettings";
import RoundStrategy from "./RoundStrategy";
import NewsImpactFeed from "./NewsImpactFeed";
import { buildStrategyPlayers } from "@/lib/draft-strategy";
import { DEFAULT_LEAGUE_CONFIG, type DraftAnalysis, type LeagueConfig } from "@/data/draft-analysis";

const LEAGUE_KEY = "draft_league_v2";
const leagueListeners = new Set<() => void>();
function subscribeLeague(callback: () => void) {
  leagueListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => { leagueListeners.delete(callback); window.removeEventListener("storage", callback); };
}
const leagueSnapshot = () => localStorage.getItem(LEAGUE_KEY) ?? "";
const serverLeagueSnapshot = () => "";

function parseLeague(raw: string): LeagueConfig {
  try {
    const saved = raw ? JSON.parse(raw) : null;
    return saved ? { ...DEFAULT_LEAGUE_CONFIG, ...saved, starters: { ...DEFAULT_LEAGUE_CONFIG.starters, ...saved.starters } } : DEFAULT_LEAGUE_CONFIG;
  } catch { return DEFAULT_LEAGUE_CONFIG; }
}

function ChartCard({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <p className="text-sm text-text-muted mb-5 max-w-3xl">{blurb}</p>
      {children}
    </div>
  );
}

export default function DraftDashboard({ data }: { data: DraftAnalysis }) {
  const { meta, irStashTargets } = data;
  const leagueRaw = useSyncExternalStore(subscribeLeague, leagueSnapshot, serverLeagueSnapshot);
  const league = useMemo(() => parseLeague(leagueRaw), [leagueRaw]);
  const players = useMemo(() => buildStrategyPlayers(data, league), [data, league]);

  const updateLeague = (next: LeagueConfig) => {
    localStorage.setItem(LEAGUE_KEY, JSON.stringify({ ...next, draftSlot: Math.min(next.draftSlot, next.teams) }));
    leagueListeners.forEach((listener) => listener());
  };

  return (
    <div className="min-h-screen">
      <SectionWrapper id="header" className="py-10 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Draft War Room</h1>
        <p className="font-mono text-sm text-accent-text mt-2">
          {league.scoring.replace("_", "-").toUpperCase()} · {league.teams}-team · {meta.rounds} rounds · {meta.season} season
        </p>
        <p className="font-mono text-xs text-text-muted mt-1">
          {meta.playerCount} players · ADP {meta.adpMatched} · generated {meta.generatedAt} · news-aware, human approved
        </p>
        {meta.stale && <p className="font-mono text-xs text-amber-500 mt-2">⚠ Upcoming-season projections were unavailable—showing prior-season data.</p>}
      </SectionWrapper>

      <SectionWrapper id="league" className="py-4">
        <LeagueSettings value={league} onChange={updateLeague} />
      </SectionWrapper>

      <SectionWrapper id="summary" className="py-4"><StatTiles players={players} /></SectionWrapper>

      <SectionWrapper id="simulator" className="py-4">
        <ChartCard title="Live draft assistant" blurb="Mark picks as they happen. Recommendations combine league-specific VOR, positional drop-off, roster need, ADP uncertainty, and the probability a target survives to your next pick.">
          <DraftSimulator players={players} meta={{ ...meta, teams: league.teams }} config={league} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="positional" className="py-4">
        <ChartCard title="Best position and targets by round" blurb="Expected marginal value over replacement for players likely to be available in each round. This identifies positional scarcity instead of simply rewarding positions with more raw points.">
          <RoundStrategy players={players} config={league} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="news" className="py-4">
        <ChartCard title="News and market signals" blurb="Approved roster, injury, reporting, and social evidence behind ranking changes. Every impact keeps its baseline visible and links back to its source.">
          <NewsImpactFeed evidence={data.evidence ?? []} health={data.sourceHealth ?? []} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="value" className="py-4">
        <ChartCard title="Draft priority vs. market price" blurb="Players must provide positive starter value before they can be called targets. Priority is driven mainly by league-adjusted VOR, then by how much better a player is than the alternatives normally available at the same draft cost.">
          <ValueGapChart players={players} teams={league.teams} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="movers" className="py-4">
        <ChartCard title={`${meta.priorSeason} actuals vs. ${meta.season} adjusted outlook`} blurb="Prior-season production compared with league-adjusted projections. Team changes are marked and rookies are excluded.">
          <RiserFallerChart players={players} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="ir" className="py-4">
        <ChartCard title={`IR-stash targets (${league.teams}-team, ${league.ir} IR slots)`} blurb="Injured players with enough projected value to justify a late pick and an IR slot.">
          <IRStashTargets targets={irStashTargets} irSlots={league.ir} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="board" className="py-4">
        <ChartCard title="Draft board" blurb="The full board with baseline and adjusted value, news confidence, injury status, and team changes.">
          <DraftBoard players={players} />
        </ChartCard>
      </SectionWrapper>

      <footer className="max-w-3xl mx-auto text-center mt-4 mb-16 px-4">
        <p className="font-mono text-xs text-text-dim leading-relaxed">
          VOR is recalculated from this league&apos;s starter and FLEX demand. News adjustments are confidence-weighted, capped, source-linked, and never replace the baseline projection. For entertainment—not betting advice. Refresh with <span className="text-text-muted">npm run fetch-fantasy</span>.
        </p>
      </footer>
    </div>
  );
}
