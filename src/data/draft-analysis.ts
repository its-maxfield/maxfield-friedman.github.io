// ─── Types ───────────────────────────────────────────────────────────────────
// Shape of the build-time draft dataset produced by scripts/fetch-fantasy-data.mjs.
// Mirrors the site-config.ts convention: interfaces here, raw JSON imported below.

export type Position = "QB" | "RB" | "WR" | "TE";
export type ScoringFormat = "standard" | "half_ppr" | "ppr";
export type RiskMode = "conservative" | "balanced" | "upside";

export interface LeagueConfig {
  teams: number;
  scoring: ScoringFormat;
  passTd: 4 | 6;
  starters: Record<Position, number>;
  flex: number;
  bench: number;
  ir: number;
  draftSlot: number;
  riskMode: RiskMode;
}

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
  /** Optional news-aware values produced by a refresh. Older datasets remain valid. */
  baselineProjPts?: number;
  adjustedProjPts?: number;
  adjustedVor?: number;
  adjustedRank?: number;
  newsMultiplier?: number;
  newsConfidence?: number;
  momentumScore?: number;
  adpDelta?: number;
  evidenceIds?: string[];
  lastImpactAt?: string | null;
}

export type NewsEventType =
  | "trade"
  | "signing"
  | "release"
  | "injury"
  | "recovery"
  | "suspension"
  | "depth_chart"
  | "usage"
  | "momentum";

export interface NewsEvidence {
  id: string;
  playerIds: string[];
  source: string;
  sourceTier: "official" | "reporter" | "publication" | "social";
  title: string;
  url: string;
  author?: string;
  publishedAt: string;
  eventType: NewsEventType;
  direction: -1 | 0 | 1;
  confidence: number;
  summary: string;
}

export interface PlayerSignal {
  playerId: string;
  evidenceIds: string[];
  eventType: NewsEventType;
  direction: -1 | 0 | 1;
  confidence: number;
  projectionMultiplier: number;
  momentumScore: number;
  approved: boolean;
  lastImpactAt: string;
  expiresAt: string;
}

export interface AdpSnapshot {
  capturedAt: string;
  scoring: ScoringFormat;
  teams: number;
  ranks: Record<string, number>;
}

export interface SourceHealth {
  source: string;
  status: "ok" | "skipped" | "stale" | "error";
  checkedAt: string;
  detail?: string;
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
  evidence?: NewsEvidence[];
  signals?: PlayerSignal[];
  adpHistory?: AdpSnapshot[];
  sourceHealth?: SourceHealth[];
  adpVariants?: Record<string, Record<string, { adp: number; stdev: number | null }>>;
}

export type BustRisk = "low" | "med" | "high";

// ─── Data ────────────────────────────────────────────────────────────────────

import raw from "./draft-analysis.json";

export const draftAnalysis = raw as unknown as DraftAnalysis;

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];

export const DEFAULT_LEAGUE_CONFIG: LeagueConfig = {
  teams: 10,
  scoring: "half_ppr",
  passTd: 4,
  starters: { QB: 1, RB: 2, WR: 2, TE: 1 },
  flex: 1,
  bench: 8,
  ir: 2,
  draftSlot: 1,
  riskMode: "balanced",
};

/** CSS custom properties for each position color (defined in globals.css @theme). */
export const POS_COLOR: Record<Position, string> = {
  QB: "var(--color-pos-qb)",
  RB: "var(--color-pos-rb)",
  WR: "var(--color-pos-wr)",
  TE: "var(--color-pos-te)",
};
