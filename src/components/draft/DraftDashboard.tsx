"use client";

import SectionWrapper from "@/components/ui/SectionWrapper";
import StatTiles from "./StatTiles";
import PositionValueByRound from "./PositionValueByRound";
import ValueGapChart from "./ValueGapChart";
import RiserFallerChart from "./RiserFallerChart";
import IRStashTargets from "./IRStashTargets";
import DraftBoard from "./DraftBoard";
import DraftSimulator from "./DraftSimulator";
import type { DraftAnalysis } from "@/data/draft-analysis";

function ChartCard({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <p className="text-sm text-text-muted mb-5 max-w-2xl">{blurb}</p>
      {children}
    </div>
  );
}

export default function DraftDashboard({ data }: { data: DraftAnalysis }) {
  const { meta, players, roundPositionStats, irStashTargets } = data;

  return (
    <div className="min-h-screen">
      <SectionWrapper id="header" className="py-10 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Draft War Room</h1>
        <p className="font-mono text-sm text-accent-text mt-2">
          Half-PPR · {meta.teams}-team · {meta.rounds} rounds · {meta.season} season
        </p>
        <p className="font-mono text-xs text-text-muted mt-1">
          {meta.playerCount} players · ADP {meta.adpMatched} · generated {meta.generatedAt} · sources: Sleeper + FantasyFootballCalculator
        </p>
        {meta.stale && (
          <p className="font-mono text-xs text-amber-500 mt-2">
            ⚠ Upcoming-season projections were unavailable — showing prior-season data.
          </p>
        )}
      </SectionWrapper>

      <SectionWrapper id="summary" className="py-4">
        <StatTiles players={players} />
      </SectionWrapper>

      <SectionWrapper id="simulator" className="py-4">
        <ChartCard
          title="Live draft assistant"
          blurb="Set your draft slot, then mark players as they come off the board. Your snake picks are computed, others are simulated by ADP, and the best available (by VOR, with sane roster caps) is recommended at each of your picks. Progress saves in your browser."
        >
          <DraftSimulator players={players} meta={meta} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="positional" className="py-4">
        <ChartCard
          title="Positional value by draft round"
          blurb="Average (or median) projected half-PPR points for each position, bucketed by the round they're actually drafted in. The callout shows which position holds the scoring edge in each round — i.e. when one position is worth taking over another. Switch positions and metric with the pills."
        >
          <PositionValueByRound stats={roundPositionStats} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="value" className="py-4">
        <ChartCard
          title="Draft cost vs. true value — steals & busts"
          blurb="Where a player is drafted (ADP rank) vs. where their Value Over Replacement says they should go. Steals are valued above their draft cost; reaches the opposite. Ringed ⚠ marks are high bust-risk (volatile ADP, age, or injury) — reaches you especially want to avoid. Filter by position. Replacement baselines: QB10 / RB25 / WR30 / TE10."
        >
          <ValueGapChart players={players} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="movers" className="py-4">
        <ChartCard
          title="Risers & fallers: 2025 → 2026"
          blurb="Last season's actual half-PPR points vs. this year's projection — the biggest movers, filterable by position. Ringed dots changed NFL teams this offseason, which often drives the swing. Rookies are excluded (no prior season)."
        >
          <RiserFallerChart players={players} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="ir" className="py-4">
        <ChartCard
          title={`IR-stash targets (${meta.teams}-team, 2 IR slots)`}
          blurb="Players whose talent says draft them high, but who are starting the season hurt — so their ADP craters. With two IR slots you can draft them late, stash them on IR, and get a starter back mid-season."
        >
          <IRStashTargets targets={irStashTargets} irSlots={2} />
        </ChartCard>
      </SectionWrapper>

      <SectionWrapper id="board" className="py-4">
        <ChartCard
          title="Draft board"
          blurb="The full board, filterable by position and sortable by any metric. Risk = bust risk; injury tags and team-changes are flagged inline. Tap a column header to sort."
        >
          <DraftBoard players={players} />
        </ChartCard>
      </SectionWrapper>

      <footer className="max-w-2xl mx-auto text-center mt-4 mb-16 px-4">
        <p className="font-mono text-xs text-text-dim leading-relaxed">
          VOR (Value Over Replacement) = projected points minus the last startable player at that position, so scarce
          RB/WR points count for more than abundant QB points in a 1-QB league. Bust risk blends ADP volatility, age,
          injury, and regression. Projections and prior-year stats from Sleeper; ADP from real half-PPR mock drafts
          (FantasyFootballCalculator). For entertainment — not betting advice. Refresh with{" "}
          <span className="text-text-muted">npm run fetch-fantasy</span>.
        </p>
      </footer>
    </div>
  );
}
