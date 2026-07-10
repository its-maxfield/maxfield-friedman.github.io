// ─── Types ───────────────────────────────────────────────────────────────────
// Shape of the build-time draft dataset produced by scripts/fetch-fantasy-data.mjs.
// Mirrors the site-config.ts convention: interfaces here, raw JSON imported below.

export type Position = "QB" | "RB" | "WR" | "TE";

export interface DraftPlayer {
  id: string;
  name: string;
  pos: Position;
  team: string;
  age: number | null;
  yrsExp: number | null;
  bye: number | null;
  /** Average draft position (half-PPR, from the league size in meta.teams). */
  adp: number;
  adpRound: number;
  adpPick: number | null;
  /** Earliest / latest pick seen in real drafts (ceiling / floor perception). */
  adpHigh: number | null;
  adpLow: number | null;
  /** Standard deviation of draft position — higher = more boom/bust uncertainty. */
  stdev: number | null;
  /** Draft-cost rank, 1 = earliest off the board. */
  adpOvrRank: number;
  /** Projected half-PPR points for the upcoming season. */
  projPts: number;
  projPosRank: number;
  projOvrRank: number;
  /** Value over replacement — points above the position's baseline starter. */
  vor: number;
  vorOvrRank: number;
  /** Prior-season actual half-PPR points; null for rookies. */
  lastPts: number | null;
  /** Prior team, only set when the player changed teams this offseason. */
  priorTeam: string | null;
  /** adpOvrRank − vorOvrRank. Positive = drafted later than value warrants (steal). */
  valueGap: number;
  teamChanged: boolean;
  tier: number;
  /** Injury designation (IR / PUP / Questionable / …) or null if healthy. */
  injuryStatus: string | null;
  /** True if likely to start the season injured — an IR-stash consideration. */
  irStash: boolean;
  /** 0–100 bust-risk from volatility, age, injury, regression. */
  bustScore: number;
  bustRisk: "low" | "med" | "high";
  /** Component stat projections, kept for phase-2 league-specific rescoring. */
  comp?: Record<string, number>;
}

export interface PosStat {
  mean: number | null;
  median: number | null;
  n: number;
}

export interface RoundPositionStat {
  round: number;
  QB: PosStat;
  RB: PosStat;
  WR: PosStat;
  TE: PosStat;
}

/** Injured player worth stashing on an IR slot — usually undrafted or ADP-cratered. */
export interface IRStashTarget {
  id: string;
  name: string;
  pos: Position;
  team: string;
  projPts: number;
  injuryStatus: string | null;
  adp: number | null;
  adpRound: number | null;
  note: string | null;
}

export interface DraftMeta {
  season: number;
  priorSeason: number;
  scoring: "half_ppr";
  teams: number;
  rounds: number;
  generatedAt: string;
  stale: boolean;
  sources: string[];
  playerCount: number;
  adpMatched: string;
  replacementPts: Record<Position, number>;
}

export interface DraftAnalysis {
  meta: DraftMeta;
  players: DraftPlayer[];
  roundPositionStats: RoundPositionStat[];
  irStashTargets: IRStashTarget[];
}

export type BustRisk = "low" | "med" | "high";

// ─── Data ────────────────────────────────────────────────────────────────────

import raw from "./draft-analysis.json";

export const draftAnalysis = raw as unknown as DraftAnalysis;

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];

/** CSS custom properties for each position color (defined in globals.css @theme). */
export const POS_COLOR: Record<Position, string> = {
  QB: "var(--color-pos-qb)",
  RB: "var(--color-pos-rb)",
  WR: "var(--color-pos-wr)",
  TE: "var(--color-pos-te)",
};
