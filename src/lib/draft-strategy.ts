import {
  POSITIONS,
  type DraftAnalysis,
  type DraftPlayer,
  type LeagueConfig,
  type PlayerSignal,
  type Position,
} from "@/data/draft-analysis";

export interface StrategyPlayer extends DraftPlayer {
  baselineProjPts: number;
  adjustedProjPts: number;
  adjustedVor: number;
  adjustedRank: number;
  newsMultiplier: number;
  newsConfidence: number;
  momentumScore: number;
  evidenceIds: string[];
}

export interface PickRecommendation {
  player: StrategyPlayer;
  availabilityNextPick: number;
  positionDropoff: number;
  expectedEdge: number;
  reason: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function scoreComponents(player: DraftPlayer, config: LeagueConfig): number {
  const c = player.comp;
  if (!c) {
    const receptionDelta = config.scoring === "ppr" ? 0.5 : config.scoring === "standard" ? -0.5 : 0;
    return round1(player.projPts + receptionDelta * 0);
  }
  const reception = config.scoring === "ppr" ? 1 : config.scoring === "half_ppr" ? 0.5 : 0;
  return round1(
    (c.pass_yd ?? 0) / 25 +
      (c.pass_td ?? 0) * config.passTd -
      (c.pass_int ?? 0) * 2 +
      (c.rush_yd ?? 0) / 10 +
      (c.rush_td ?? 0) * 6 +
      (c.rec ?? 0) * reception +
      (c.rec_yd ?? 0) / 10 +
      (c.rec_td ?? 0) * 6 -
      (c.fum_lost ?? 0) * 2,
  );
}

function activeSignal(signals: PlayerSignal[], id: string): PlayerSignal | undefined {
  const now = Date.now();
  return signals
    .filter((s) => s.playerId === id && s.approved && Date.parse(s.expiresAt) > now)
    .sort((a, b) => Date.parse(b.lastImpactAt) - Date.parse(a.lastImpactAt))[0];
}

function riskMultiplier(player: DraftPlayer, signal: PlayerSignal | undefined, mode: LeagueConfig["riskMode"]) {
  if (!signal) return mode === "conservative" ? 1 - (player.bustScore / 100) * 0.05 : 1;
  const raw = clamp(signal.projectionMultiplier, 0.88, 1.12);
  const delta = raw - 1;
  if (mode === "conservative") {
    const news = delta > 0 ? delta * signal.confidence * 0.5 : delta * signal.confidence;
    return 1 + news - (player.bustScore / 100) * 0.05;
  }
  if (mode === "upside") return 1 + (delta > 0 ? delta : delta * signal.confidence * 0.6);
  return 1 + delta * signal.confidence;
}

function replacementRanks(players: Array<{ pos: Position; points: number }>, config: LeagueConfig) {
  const ranks = Object.fromEntries(POSITIONS.map((p) => [p, config.teams * config.starters[p]])) as Record<Position, number>;
  const eligible = POSITIONS.flatMap((pos) =>
    players
      .filter((p) => p.pos === pos)
      .sort((a, b) => b.points - a.points)
      .slice(ranks[pos])
      .map((p) => ({ ...p, pos })),
  )
    .sort((a, b) => b.points - a.points)
    .slice(0, config.teams * config.flex);
  for (const p of eligible) ranks[p.pos] += 1;
  return ranks;
}

export function buildStrategyPlayers(data: DraftAnalysis, config: LeagueConfig): StrategyPlayer[] {
  const signals = data.signals ?? [];
  const formatKey = config.scoring === "half_ppr" ? "half-ppr" : config.scoring;
  const variant = data.adpVariants?.[`${formatKey}:${config.teams}`] ?? {};
  const history = (data.adpHistory ?? []).filter((s) => s.scoring === config.scoring && s.teams === config.teams);
  const oldestRanks = history[0]?.ranks ?? {};
  const pricedPlayers = data.players.map((player) => ({ ...player, ...(variant[player.id] ?? {}), adpRound: Math.ceil((variant[player.id]?.adp ?? player.adp) / config.teams) }));
  [...pricedPlayers].sort((a, b) => a.adp - b.adp).forEach((p, i) => (p.adpOvrRank = i + 1));
  const scored = pricedPlayers.map((player) => {
    const signal = activeSignal(signals, player.id);
    const baseline = scoreComponents(player, config);
    const multiplier = riskMultiplier(player, signal, config.riskMode);
    return { player, signal, baseline, adjusted: round1(baseline * multiplier) };
  });
  const ranks = replacementRanks(scored.map((s) => ({ pos: s.player.pos, points: s.adjusted })), config);
  const replacement = Object.fromEntries(
    POSITIONS.map((pos) => {
      const group = scored.filter((s) => s.player.pos === pos).sort((a, b) => b.adjusted - a.adjusted);
      return [pos, group[Math.max(0, Math.min(group.length, ranks[pos]) - 1)]?.adjusted ?? 0];
    }),
  ) as Record<Position, number>;
  const enriched = scored.map(({ player, signal, baseline, adjusted }) => ({
    ...player,
    projPts: adjusted,
    baselineProjPts: baseline,
    adjustedProjPts: adjusted,
    vor: round1(adjusted - replacement[player.pos]),
    adjustedVor: round1(adjusted - replacement[player.pos]),
    adjustedRank: 0,
    newsMultiplier: signal?.projectionMultiplier ?? 1,
    newsConfidence: signal?.confidence ?? 0,
    momentumScore: signal?.momentumScore ?? 0,
    adpDelta: oldestRanks[player.id] == null ? 0 : round1(oldestRanks[player.id] - player.adp),
    evidenceIds: signal?.evidenceIds ?? [],
  }));
  [...enriched].sort((a, b) => b.adjustedVor - a.adjustedVor).forEach((p, i) => {
    p.adjustedRank = i + 1;
    p.vorOvrRank = i + 1;
    p.valueGap = p.adpOvrRank - (i + 1);
  });
  return enriched;
}

function seededRandom(seedText: string) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulatedAvailability(player: StrategyPlayer, nextOverall: number, followingOverall: number | null) {
  if (followingOverall == null) return 0;
  const random = seededRandom(`${player.id}:${nextOverall}:${followingOverall}`);
  const sd = Math.max(3, player.stdev ?? player.adp * 0.12);
  let survives = 0;
  const trials = 1500;
  for (let i = 0; i < trials; i++) {
    const u1 = Math.max(random(), Number.EPSILON);
    const u2 = random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    if (player.adp + gaussian * sd >= followingOverall) survives++;
  }
  return survives / trials;
}

export function recommendPlayers(
  available: StrategyPlayer[],
  nextOverall: number,
  followingOverall: number | null,
  roster: Partial<Record<Position, number>> = {},
  limit = 3,
): PickRecommendation[] {
  const sorted = [...available].sort((a, b) => b.adjustedVor - a.adjustedVor);
  return sorted.slice(0, 18).map((player) => {
    const samePos = sorted.filter((p) => p.pos === player.pos && p.id !== player.id);
    const next = samePos[0];
    const dropoff = Math.max(0, player.adjustedVor - (next?.adjustedVor ?? 0));
    const availability = simulatedAvailability(player, nextOverall, followingOverall);
    const starterNeed = (roster[player.pos] ?? 0) === 0 ? 3 : 0;
    const urgency = followingOverall == null ? 0 : dropoff * (1 - availability);
    const edge = round1(player.adjustedVor + urgency * 0.35 + starterNeed);
    const why = availability < 0.25
      ? `${Math.round(availability * 100)}% chance to reach your next pick; ${player.pos} drop-off is ${round1(dropoff)} pts.`
      : `${Math.round(availability * 100)}% chance to reach your next pick; waiting remains plausible.`;
    return { player, availabilityNextPick: availability, positionDropoff: round1(dropoff), expectedEdge: edge, reason: why };
  }).sort((a, b) => b.expectedEdge - a.expectedEdge).slice(0, limit);
}

export type OpportunityStatus = "draft now" | "lean now" | "can wait" | "replacement only";

export interface PositionOpportunity {
  pos: Position;
  target: StrategyPlayer | null;
  fallback: StrategyPlayer | null;
  survivalToNext: number;
  waitValue: number;
  dropoff: number;
  priorityScore: number;
  status: OpportunityStatus;
}

export interface RoundOpportunity {
  round: number;
  overall: number;
  pickInRound: number;
  nextOverall: number | null;
  best: PositionOpportunity;
  positions: PositionOpportunity[];
}

function snakeOverall(round: number, teams: number, slot: number) {
  return round % 2 === 1 ? (round - 1) * teams + slot : round * teams - slot + 1;
}

function bestLikelyTarget(group: StrategyPlayer[], overall: number, excludeId?: string) {
  const candidates = group
    .filter((p) => p.id !== excludeId)
    .map((player) => ({ player, available: simulatedAvailability(player, overall - 1, overall) }))
    .filter((row) => row.available >= 0.35)
    .sort((a, b) => b.player.adjustedVor - a.player.adjustedVor || b.available - a.available);
  if (candidates[0]) return candidates[0].player;
  return group
    .filter((p) => p.id !== excludeId)
    .sort((a, b) => Math.abs(a.adp - overall) - Math.abs(b.adp - overall))[0] ?? null;
}

export function roundStrategy(players: StrategyPlayer[], config: LeagueConfig): RoundOpportunity[] {
  const rounds = config.starters.QB + config.starters.RB + config.starters.WR + config.starters.TE + config.flex + config.bench;
  return Array.from({ length: rounds }, (_, i) => i + 1).map((round) => {
    const overall = snakeOverall(round, config.teams, config.draftSlot);
    const nextOverall = round < rounds ? snakeOverall(round + 1, config.teams, config.draftSlot) : null;
    const positions = POSITIONS.map((pos): PositionOpportunity => {
      const group = players.filter((p) => p.pos === pos);
      const target = bestLikelyTarget(group, overall);
      if (!target) return { pos, target: null, fallback: null, survivalToNext: 0, waitValue: 0, dropoff: 0, priorityScore: -Infinity, status: "replacement only" };
      const survival = nextOverall == null ? 0 : simulatedAvailability(target, overall, nextOverall);
      const fallback = nextOverall == null ? null : bestLikelyTarget(group, nextOverall, target.id);
      const fallbackValue = fallback?.adjustedVor ?? 0;
      const waitValue = nextOverall == null ? 0 : round1(survival * target.adjustedVor + (1 - survival) * fallbackValue);
      const dropoff = round1(Math.max(0, target.adjustedVor - waitValue));
      const status: OpportunityStatus = target.adjustedVor <= 0
        ? "replacement only"
        : dropoff >= 8 && survival < 0.4
          ? "draft now"
          : dropoff >= 4 || survival < 0.35
            ? "lean now"
            : "can wait";
      return { pos, target, fallback, survivalToNext: survival, waitValue, dropoff, priorityScore: round1(target.adjustedVor + dropoff), status };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
    return { round, overall, pickInRound: round % 2 === 1 ? config.draftSlot : config.teams - config.draftSlot + 1, nextOverall, best: positions[0], positions };
  });
}
