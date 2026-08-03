import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "src", "data", "draft-analysis.json");
const SOURCES_PATH = path.join(ROOT, "src", "data", "fantasy-sources.json");
const now = new Date();
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const config = JSON.parse(fs.readFileSync(SOURCES_PATH, "utf8"));
const health = [];
const rawItems = [];

const normalize = (s = "") => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const stripHtml = (s = "") => s.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const idFor = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

async function fetchText(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { "User-Agent": "draft-war-room/2.0", ...(options.headers ?? {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function addHealth(source, status, detail) { health.push({ source, status, checkedAt: now.toISOString(), ...(detail ? { detail } : {}) }); }
function addItem(item) { if (item.title && item.url) rawItems.push(item); }

async function collectSleeper() {
  try {
    const [adds, drops] = await Promise.all([
      fetchText("https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=50"),
      fetchText("https://api.sleeper.app/v1/players/nfl/trending/drop?lookback_hours=24&limit=50"),
    ]);
    for (const [kind, rows] of [["add", JSON.parse(adds)], ["drop", JSON.parse(drops)]]) {
      for (const row of rows) {
        const player = data.players.find((p) => p.id === String(row.player_id));
        if (!player) continue;
        addItem({ title: `${player.name} trending ${kind}`, url: `https://sleeper.com/players/${player.id}`, source: "Sleeper trends", tier: "publication", publishedAt: now.toISOString(), text: `${row.count} ${kind}s in 24 hours`, playerIds: [player.id], forcedType: "momentum", forcedDirection: kind === "add" ? 1 : -1, engagement: row.count ?? 0 });
      }
    }
    addHealth("Sleeper trends", "ok", `${JSON.parse(adds).length} adds / ${JSON.parse(drops).length} drops`);
  } catch (err) { addHealth("Sleeper trends", "error", err.message); }
}

function xmlValue(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i"));
  return stripHtml(m?.[1] ?? "");
}

async function collectRss() {
  for (const feed of config.rss ?? []) {
    try {
      const xml = await fetchText(feed.url);
      const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
      for (const block of blocks.slice(0, config.limits.itemsPerSource)) {
        const linkMatch = block.match(/<link[^>]+href=["']([^"']+)/i);
        addItem({ title: xmlValue(block, "title"), url: linkMatch?.[1] ?? xmlValue(block, "link"), source: feed.name, tier: feed.tier ?? "publication", publishedAt: xmlValue(block, "pubDate") || xmlValue(block, "updated") || now.toISOString(), text: xmlValue(block, "description") || xmlValue(block, "summary") });
      }
      addHealth(feed.name, "ok", `${blocks.length} items`);
    } catch (err) { addHealth(feed.name, "error", err.message); }
  }
  if (!(config.rss ?? []).length) addHealth("RSS/news", "skipped", "No feeds configured in fantasy-sources.json");
}

async function collectBluesky() {
  try {
    let count = 0;
    for (const q of config.blueskyQueries ?? []) {
      const json = JSON.parse(await fetchText(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=${config.limits.itemsPerSource}`));
      for (const row of json.posts ?? []) {
        const postId = row.uri?.split("/").pop();
        const handle = row.author?.handle;
        addItem({ title: String(row.record?.text ?? "").slice(0, 180), text: row.record?.text ?? "", url: `https://bsky.app/profile/${handle}/post/${postId}`, source: "Bluesky", author: handle, tier: "social", publishedAt: row.record?.createdAt ?? row.indexedAt ?? now.toISOString(), engagement: (row.likeCount ?? 0) + (row.repostCount ?? 0) * 2 });
        count++;
      }
    }
    addHealth("Bluesky", "ok", `${count} posts`);
  } catch (err) { addHealth("Bluesky", "error", err.message); }
}

async function collectX() {
  if (!process.env.X_BEARER_TOKEN) return addHealth("X", "skipped", "X_BEARER_TOKEN is not configured");
  try {
    const max = Math.max(10, Math.min(100, config.limits.xPostsPerRun ?? 25));
    const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(config.xQuery)}&max_results=${max}&tweet.fields=created_at,public_metrics,author_id`;
    const json = JSON.parse(await fetchText(url, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }));
    for (const row of json.data ?? []) addItem({ title: row.text.slice(0, 180), text: row.text, url: `https://x.com/i/web/status/${row.id}`, source: "X", tier: "social", publishedAt: row.created_at ?? now.toISOString(), engagement: (row.public_metrics?.like_count ?? 0) + (row.public_metrics?.retweet_count ?? 0) * 2 });
    addHealth("X", "ok", `${json.data?.length ?? 0} posts`);
  } catch (err) { addHealth("X", "error", err.message); }
}

async function collectReddit() {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) return addHealth("Reddit", "skipped", "Reddit OAuth secrets are not configured");
  try {
    const basic = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString("base64");
    const token = JSON.parse(await fetchText("https://www.reddit.com/api/v1/access_token", { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" }));
    const json = JSON.parse(await fetchText(`https://oauth.reddit.com/r/${config.redditSubreddit}/new?limit=${config.limits.itemsPerSource}`, { headers: { Authorization: `Bearer ${token.access_token}` } }));
    for (const child of json.data?.children ?? []) { const row = child.data; addItem({ title: row.title, text: `${row.title} ${row.selftext ?? ""}`.slice(0, 500), url: `https://reddit.com${row.permalink}`, source: "Reddit", author: row.author, tier: "social", publishedAt: new Date(row.created_utc * 1000).toISOString(), engagement: (row.score ?? 0) + (row.num_comments ?? 0) }); }
    addHealth("Reddit", "ok", `${json.data?.children?.length ?? 0} posts`);
  } catch (err) { addHealth("Reddit", "error", err.message); }
}

const RULES = [
  { type: "injury", direction: -1, words: ["injured", "injury", "out for", "torn", "surgery", "ir ", "pup"] },
  { type: "recovery", direction: 1, words: ["cleared", "activated", "returned to practice", "fully healthy", "recovery"] },
  { type: "trade", direction: 0, words: ["traded", "trade to", "acquired"] },
  { type: "signing", direction: 0, words: ["signed", "signing", "agreed to terms"] },
  { type: "release", direction: -1, words: ["released", "waived", "cut by"] },
  { type: "suspension", direction: -1, words: ["suspended", "suspension"] },
  { type: "depth_chart", direction: 1, words: ["named starter", "first team", "depth chart", "promoted"] },
  { type: "usage", direction: 1, words: ["more touches", "increased role", "featured", "breakout"] },
];
const tierBase = { official: 0.9, reporter: 0.75, publication: 0.65, social: 0.3 };

function classify(item) {
  const text = normalize(`${item.title} ${item.text ?? ""}`);
  const playerIds = item.playerIds ?? data.players.filter((p) => text.includes(normalize(p.name))).map((p) => p.id);
  if (!playerIds.length) return null;
  const rule = item.forcedType ? { type: item.forcedType, direction: item.forcedDirection } : RULES.find((r) => r.words.some((word) => text.includes(normalize(word))));
  if (!rule) return null;
  const ageHours = Math.max(0, (now - new Date(item.publishedAt)) / 36e5);
  const recency = Math.pow(0.5, ageHours / 72);
  const engagement = Math.min(0.12, Math.log10(1 + (item.engagement ?? 0)) * 0.04);
  return { ...item, playerIds, eventType: rule.type, direction: rule.direction, confidence: clamp(tierBase[item.tier] * recency + engagement, 0.1, 1) };
}

await Promise.all([collectSleeper(), collectRss(), collectBluesky(), collectX(), collectReddit()]);
const deduped = new Map();
for (const item of rawItems) { const key = idFor(`${normalize(item.title)}|${item.playerIds?.join(",") ?? ""}`); if (!deduped.has(key)) deduped.set(key, { ...item, id: key }); }
const classified = [...deduped.values()].map(classify).filter(Boolean);

// Independent corroboration raises confidence; uncorroborated social chatter is evidence only.
for (const item of classified) {
  const corroborators = classified.filter((other) => other.id !== item.id && other.eventType === item.eventType && other.playerIds.some((id) => item.playerIds.includes(id)) && other.source !== item.source);
  item.confidence = clamp(item.confidence + Math.min(0.2, corroborators.length * 0.1), 0, 1);
}

const evidence = classified.map((item) => ({ id: item.id, playerIds: item.playerIds, source: item.source, sourceTier: item.tier, title: item.title, url: item.url, ...(item.author ? { author: item.author } : {}), publishedAt: new Date(item.publishedAt).toISOString(), eventType: item.eventType, direction: item.direction, confidence: Math.round(item.confidence * 100) / 100, summary: stripHtml(item.text ?? item.title).slice(0, 240) }));
const signals = [];
for (const player of data.players) {
  const items = classified.filter((item) => item.playerIds.includes(player.id));
  if (!items.length) continue;
  const actionable = items.filter((item) => item.tier !== "social" || item.confidence >= 0.55 || items.some((other) => other.id !== item.id && other.source !== item.source));
  if (!actionable.length) continue;
  const weighted = actionable.reduce((sum, item) => sum + item.direction * item.confidence, 0);
  const confidence = clamp(actionable.reduce((sum, item) => sum + item.confidence, 0) / actionable.length, 0, 1);
  const direction = weighted > 0.15 ? 1 : weighted < -0.15 ? -1 : 0;
  const magnitude = Math.min(0.12, Math.abs(weighted) * 0.035);
  const last = actionable.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];
  signals.push({ playerId: player.id, evidenceIds: actionable.map((i) => i.id), eventType: last.eventType, direction, confidence: Math.round(confidence * 100) / 100, projectionMultiplier: Math.round((1 + direction * magnitude) * 1000) / 1000, momentumScore: Math.round(clamp(weighted * 35, -100, 100)), approved: true, lastImpactAt: new Date(last.publishedAt).toISOString(), expiresAt: new Date(new Date(last.publishedAt).getTime() + 21 * 864e5).toISOString() });
}

const snapshot = { capturedAt: now.toISOString(), scoring: data.meta.scoring, teams: data.meta.teams, ranks: Object.fromEntries(data.players.map((p) => [p.id, p.adp])) };
const priorHistory = (data.adpHistory ?? []).filter((s) => Date.now() - Date.parse(s.capturedAt) < 90 * 864e5);
data.evidence = evidence;
data.signals = signals;
data.sourceHealth = health;
data.adpHistory = [...priorHistory, snapshot].slice(-360);
data.meta.sources = [...new Set([...(data.meta.sources ?? []), ...health.filter((h) => h.status === "ok").map((h) => h.source)])];
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
console.log(`News refresh: ${evidence.length} evidence items, ${signals.length} actionable player signals.`);
for (const item of health) console.log(`${item.source}: ${item.status}${item.detail ? ` (${item.detail})` : ""}`);
