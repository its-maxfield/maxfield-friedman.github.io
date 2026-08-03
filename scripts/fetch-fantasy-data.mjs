// ─── Fantasy draft data pipeline ───────────────────────────────────────────────
//
// Pulls FREE, public fantasy-football data, joins it, computes draft-strategy
// metrics, and writes a compact JSON blob that the (gated) draft page imports at
// build time. Run locally and COMMIT the output — never fetched in CI, so a flaky
// or undocumented endpoint can never break a deploy.
//
//   npm run fetch-fantasy            # uses the current season
//   SEASON=2026 npm run fetch-fantasy
//
// Sources (half-PPR, 10-team lens):
//   - api.sleeper.app  /v1/players/nfl                    player metadata + injury/status
//   - api.sleeper.com  /projections/nfl/<season>          projected points + components
//   - api.sleeper.com  /stats/nfl/<priorSeason>           prior-year actuals + team-of-record
//   - fantasyfootballcalculator.com /api/v1/adp/half-ppr  real-draft ADP (the "spine") + volatility

import fs from "node:fs";
import path from "node:path";

// ─── Config ─────────────────────────────────────────────────────────────────
const now = new Date();
const SEASON = Number(process.env.SEASON) || now.getFullYear();
const PRIOR = SEASON - 1;
const TEAMS = Number(process.env.TEAMS) || 10;
const POSITIONS = ["QB", "RB", "WR", "TE"];
// Replacement level per position for a 10-team half-PPR league (starter demand incl. flex share):
// 1 QB & 1 TE per team; ~2.5 RB & ~3 WR per team once the flex is spread across RB/WR.
const REPLACEMENT_RANK = { QB: 10, RB: 25, WR: 30, TE: 10 };
const OUT_PATH = path.join(process.cwd(), "src", "data", "draft-analysis.json");
const previousOutput = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) : {};

// Injury designations that mean a player likely misses time — i.e. an IR-stash candidate.
const IR_STATUSES = new Set(["Injured Reserve", "Physically Unable to Perform", "Non Football Injury"]);
const IR_INJURY = new Set(["IR", "PUP", "NFI", "Sus", "Out", "DNR"]);
function normInjury(m) {
  const status = m.status ?? null; // roster status: Active / Inactive / Injured Reserve / ...
  const inj = m.injury_status ?? null; // IR / PUP / Questionable / Out / DNR / ...
  const irStash = IR_STATUSES.has(status) || (inj && IR_INJURY.has(String(inj)));
  // human-facing short label
  const label = irStash ? (inj && IR_INJURY.has(String(inj)) ? String(inj) : "IR") : inj && inj !== "NA" ? String(inj) : null;
  return { injuryStatus: label, irStash: !!irStash };
}

// Historical franchise-relocation / abbreviation aliases so team comparisons line up.
const TEAM_ALIAS = { JAC: "JAX", LA: "LAR", WAS: "WSH", OAK: "LV", SD: "LAC", STL: "LAR", ARZ: "ARI", BLT: "BAL", CLV: "CLE", HST: "HOU" };
const normTeam = (t) => TEAM_ALIAS[t] ?? (t || "");

// Name normalization for the one cross-source join (FFC has no Sleeper id).
const normName = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/\./g, "") // "A.J." -> "aj"
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "") // drop generational suffixes
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchJson(url, { tries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "maxfield-portfolio-draft-tool" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw new Error(`fetch failed for ${url}: ${lastErr?.message}`);
}

const median = (nums) => {
  const a = nums.filter((n) => typeof n === "number" && !Number.isNaN(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const round1 = (n) => (typeof n === "number" ? Math.round(n * 10) / 10 : null);
const roundInt = (n) => (typeof n === "number" ? Math.round(n) : undefined);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Age at which decline risk kicks in, by position.
const AGE_CLIFF = { RB: 28, WR: 30, TE: 30, QB: 36 };

// Transparent 0–100 bust-risk score from draft-cost volatility, age, injury, and
// regression off a career year. Returns { bustScore, bustRisk }.
function computeBust({ pos, age, adp, stdev, lastPts, projPts, irStash, injuryStatus }) {
  let s = 0;
  // Draft-cost volatility (coefficient of variation) — uncertain ADP = boom/bust.
  if (stdev && adp) s += clamp((stdev / adp) * 120, 0, 40);
  // Age decline.
  const cliff = AGE_CLIFF[pos] ?? 30;
  if (age && age >= cliff) s += 22;
  if (age && age >= cliff + 2) s += 10;
  // Injury.
  if (irStash) s += 30;
  else if (injuryStatus) s += 15;
  // Regression off a career-high prior year.
  if (lastPts && projPts && lastPts > projPts * 1.25) s += 15;
  const bustScore = Math.round(clamp(s, 0, 100));
  const bustRisk = bustScore >= 55 ? "high" : bustScore >= 30 ? "med" : "low";
  return { bustScore, bustRisk };
}

// Component stats kept for phase-2 league-specific rescoring.
const COMP_KEYS = ["pass_yd", "pass_td", "pass_int", "rush_yd", "rush_td", "rec", "rec_yd", "rec_td", "fum_lost"];
function pickComp(stats) {
  if (!stats) return undefined;
  const out = {};
  for (const k of COMP_KEYS) {
    const v = roundInt(stats[k]);
    if (v) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nFantasy draft data — season ${SEASON} (prior ${PRIOR}), half-PPR, ${TEAMS}-team\n`);

  const posQ = POSITIONS.map((p) => `position[]=${p}`).join("&");
  const [playersRaw, projArr, statsArr, ffcRes] = await Promise.all([
    fetchJson("https://api.sleeper.app/v1/players/nfl"),
    fetchJson(`https://api.sleeper.com/projections/nfl/${SEASON}?season_type=regular&${posQ}&order_by=pts_half_ppr`),
    fetchJson(`https://api.sleeper.com/stats/nfl/${PRIOR}?season_type=regular&${posQ}&order_by=pts_half_ppr`),
    fetchJson(`https://fantasyfootballcalculator.com/api/v1/adp/half-ppr?teams=${TEAMS}&year=${SEASON}`),
  ]);

  // ADP spine — skill positions only (DEF/PK are drafted but out of scope here).
  const ffc = (ffcRes.players || []).filter((p) => POSITIONS.includes(p.position));
  if (!ffc.length) throw new Error(`FFC returned no skill-position ADP for ${SEASON} — is the season live yet?`);

  // Sleeper stats/projections key on the same player_id as players/nfl.
  const projRow = new Map(projArr.map((r) => [String(r.player_id), r]));
  const statsRow = new Map(statsArr.map((r) => [String(r.player_id), r]));

  // Index Sleeper players by normName|pos for the FFC join.
  const idx = new Map();
  for (const [id, p] of Object.entries(playersRaw)) {
    if (!POSITIONS.includes(p.position)) continue;
    const name = p.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`;
    const key = `${normName(name)}|${p.position}`;
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push({ id, ...p, _name: name.trim() });
  }
  function matchSleeper(f) {
    const key = `${normName(f.name)}|${f.position}`;
    const cands = idx.get(key);
    if (!cands) return null;
    if (cands.length === 1) return cands[0];
    // disambiguate collisions by team
    return cands.find((c) => normTeam(c.team) === normTeam(f.team)) ?? cands[0];
  }

  // ─── Join + enrich ───────────────────────────────────────────────────────
  const misses = [];
  let players = [];
  for (const f of ffc) {
    const m = matchSleeper(f);
    if (!m) {
      misses.push(`${f.name} (${f.position}/${f.team})`);
      continue;
    }
    const proj = projRow.get(String(m.id))?.stats;
    const priorStatsRow = statsRow.get(String(m.id));
    const prior = priorStatsRow?.stats;

    const projPts = round1(proj?.pts_half_ppr) ?? 0;
    const lastPts = prior?.pts_half_ppr != null ? round1(prior.pts_half_ppr) : null;

    // Team-change: compare the team a player accrued PRIOR stats with vs current team.
    const priorTeamRaw = priorStatsRow?.team ?? null;
    const priorTeam = priorTeamRaw ? normTeam(priorTeamRaw) : null;
    const curTeam = normTeam(m.team);
    const teamChanged = !!(priorTeam && curTeam && priorTeam !== curTeam);

    const adpFmtRound = f.adp_formatted ? parseInt(String(f.adp_formatted).split(".")[0], 10) : null;
    const adp = round1(f.adp);
    const stdev = round1(f.stdev);
    const { injuryStatus, irStash } = normInjury(m);
    const { bustScore, bustRisk } = computeBust({
      pos: m.position, age: m.age, adp, stdev, lastPts, projPts, irStash, injuryStatus,
    });

    players.push({
      id: String(m.id),
      name: m._name,
      pos: m.position,
      team: curTeam,
      age: m.age ?? null,
      yrsExp: m.years_exp ?? null,
      bye: f.bye ?? m.bye_week ?? null,
      adp,
      adpRound: adpFmtRound ?? Math.ceil(f.adp / TEAMS),
      adpPick: f.adp_formatted ? parseInt(String(f.adp_formatted).split(".")[1], 10) : null,
      adpHigh: f.high ?? null, // earliest pick seen (ceiling perception)
      adpLow: f.low ?? null, // latest pick seen (floor)
      stdev,
      // ranks filled in below
      adpOvrRank: 0,
      projPts,
      projPosRank: 0,
      projOvrRank: 0,
      vor: 0,
      vorOvrRank: 0,
      lastPts,
      priorTeam: teamChanged ? priorTeam : null,
      valueGap: 0,
      teamChanged,
      tier: 0,
      injuryStatus,
      irStash,
      bustScore,
      bustRisk,
      comp: pickComp(proj),
    });
  }

  // ─── Ranks ────────────────────────────────────────────────────────────────
  // ADP overall rank = draft-cost order (earlier = 1). FFC is adp-ascending already.
  [...players]
    .sort((a, b) => a.adp - b.adp)
    .forEach((p, i) => (p.adpOvrRank = i + 1));
  // Projection overall + positional rank (higher points = better = 1).
  [...players]
    .sort((a, b) => b.projPts - a.projPts)
    .forEach((p, i) => (p.projOvrRank = i + 1));
  for (const pos of POSITIONS) {
    [...players]
      .filter((p) => p.pos === pos)
      .sort((a, b) => b.projPts - a.projPts)
      .forEach((p, i) => (p.projPosRank = i + 1));
  }

  // ─── Value Over Replacement (VOR) ──────────────────────────────────────────
  // The legit cross-position value metric: raw points minus a position's replacement
  // baseline, so scarce RB/WR points outweigh abundant QB points in a 1-QB league.
  const replacementPts = {};
  for (const pos of POSITIONS) {
    const ranked = players.filter((p) => p.pos === pos).sort((a, b) => b.projPts - a.projPts);
    const baselineIdx = Math.min(REPLACEMENT_RANK[pos], ranked.length) - 1;
    replacementPts[pos] = round1(ranked[baselineIdx]?.projPts ?? 0);
  }
  for (const p of players) p.vor = round1(p.projPts - replacementPts[p.pos]);
  [...players]
    .sort((a, b) => b.vor - a.vor)
    .forEach((p, i) => (p.vorOvrRank = i + 1));
  // Value gap: how much later a player is drafted than their VOR warrants. + = steal.
  for (const p of players) p.valueGap = p.adpOvrRank - p.vorOvrRank;

  // ─── Tiers (per position, gap-based clustering) ────────────────────────────
  for (const pos of POSITIONS) {
    const group = players.filter((p) => p.pos === pos).sort((a, b) => b.projPts - a.projPts);
    if (!group.length) continue;
    const gaps = [];
    for (let i = 1; i < group.length; i++) gaps.push(group[i - 1].projPts - group[i].projPts);
    const medGap = median(gaps) ?? 0;
    const threshold = Math.max(8, medGap * 2);
    let tier = 1;
    group[0].tier = 1;
    for (let i = 1; i < group.length; i++) {
      const drop = group[i - 1].projPts - group[i].projPts;
      if (drop > threshold && tier < 8) tier++;
      group[i].tier = tier;
    }
  }

  // ─── Round × position stats (feeds the thesis dumbbell: mean & median) ─────
  const mean = (nums) => {
    const a = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
    return a.length ? round1(a.reduce((s, n) => s + n, 0) / a.length) : null;
  };
  const maxRound = Math.max(...players.map((p) => p.adpRound));
  const roundPositionStats = [];
  for (let r = 1; r <= maxRound; r++) {
    const inRound = players.filter((p) => p.adpRound === r);
    const row = { round: r };
    for (const pos of POSITIONS) {
      const pts = inRound.filter((p) => p.pos === pos).map((p) => p.projPts);
      row[pos] = { mean: mean(pts), median: median(pts), n: pts.length };
    }
    roundPositionStats.push(row);
  }

  // ─── IR-stash targets ──────────────────────────────────────────────────────
  // Injured players with real projected value — even if their ADP has cratered or
  // they're undrafted. These are the "should go high, but starting hurt" stashes
  // for the league's 2 IR slots. Scanned across ALL Sleeper players, not just ADP.
  const boardById = new Map(players.map((p) => [p.id, p]));
  const irStashTargets = [];
  for (const [id, m] of Object.entries(playersRaw)) {
    if (!POSITIONS.includes(m.position)) continue;
    if (m.active === false) continue; // drop retired players with stale IR flags
    const { injuryStatus, irStash } = normInjury(m);
    if (!irStash) continue;
    const proj = projRow.get(String(id))?.stats;
    const projPts = round1(proj?.pts_half_ppr) ?? 0;
    const onBoard = boardById.get(String(id));
    // "Should be drafted high": needs a real current-season projection to be worth a stash.
    if (projPts < 40 && !onBoard) continue;
    irStashTargets.push({
      id: String(id),
      name: m.full_name ?? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim(),
      pos: m.position,
      team: normTeam(m.team),
      projPts,
      injuryStatus,
      adp: onBoard?.adp ?? null,
      adpRound: onBoard?.adpRound ?? null,
      note: m.injury_body_part || null,
    });
  }
  irStashTargets.sort((a, b) => b.projPts - a.projPts);

  // Final sort: by ADP (draft board order).
  players.sort((a, b) => a.adp - b.adp);

  // Pre-fetch the supported league-price lenses. Individual failures are soft:
  // the client falls back to the default half-PPR ADP instead of blocking refreshes.
  const adpVariants = {};
  adpVariants[`half-ppr:${TEAMS}`] = Object.fromEntries(players.map((p) => [p.id, { adp: p.adp, stdev: p.stdev }]));
  const variantRequests = ["standard", "half-ppr", "ppr"].flatMap((format) =>
    [8, 10, 12, 14].filter((teams) => !(format === "half-ppr" && teams === TEAMS)).map((teams) => ({ format, teams })),
  );
  const variantResults = await Promise.allSettled(
    variantRequests.map(({ format, teams }) => fetchJson(`https://fantasyfootballcalculator.com/api/v1/adp/${format}?teams=${teams}&year=${SEASON}`)),
  );
  variantResults.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    const { format, teams } = variantRequests[i];
    const entries = {};
    for (const row of result.value.players ?? []) {
      if (!POSITIONS.includes(row.position)) continue;
      const match = matchSleeper(row);
      if (match && typeof row.adp === "number") entries[String(match.id)] = { adp: round1(row.adp), stdev: round1(row.stdev) };
    }
    if (Object.keys(entries).length) adpVariants[`${format}:${teams}`] = entries;
  });

  const output = {
    meta: {
      season: SEASON,
      priorSeason: PRIOR,
      scoring: "half_ppr",
      teams: TEAMS,
      generatedAt: now.toISOString().slice(0, 10),
      stale: false,
      sources: ["sleeper/players", "sleeper/projections", "sleeper/stats", "ffc/adp"],
      rounds: ffcRes.meta?.rounds ?? Math.max(...players.map((p) => p.adpRound)),
      playerCount: players.length,
      adpMatched: `${players.length}/${ffc.length}`,
      replacementPts,
    },
    players,
    roundPositionStats,
    irStashTargets,
    // Keep the last approved evidence set until the companion news refresh
    // successfully replaces it. A transient social/news failure cannot erase it.
    evidence: previousOutput.evidence ?? [],
    signals: previousOutput.signals ?? [],
    adpHistory: previousOutput.adpHistory ?? [],
    sourceHealth: previousOutput.sourceHealth ?? [],
    adpVariants,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n");

  // ─── Report ─────────────────────────────────────────────────────────────
  const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  const withPrior = players.filter((p) => p.lastPts != null).length;
  const changers = players.filter((p) => p.teamChanged).length;
  const highBust = players.filter((p) => p.bustRisk === "high").length;
  console.log(`Matched ${players.length}/${ffc.length} skill-position ADP entries (${TEAMS}-team)`);
  console.log(`Projections: ${players.length}/${players.length} · prior-year actuals: ${withPrior}/${players.length} (rest = rookies)`);
  console.log(`Team-changers: ${changers} · IR-stash targets: ${output.irStashTargets.length} · high bust-risk: ${highBust}`);
  if (misses.length) console.log(`\nUnmatched (check name normalization):\n  ${misses.join("\n  ")}`);
  if (misses.length / ffc.length > 0.1) console.log(`\n⚠  Match rate below 90% — inspect the misses above.`);
  console.log(`\nWrote ${OUT_PATH} (${sizeKb} KB)\n`);
}

main().catch((err) => {
  console.error(`\n✗ fetch-fantasy failed: ${err.message}\n`);
  process.exit(1);
});
