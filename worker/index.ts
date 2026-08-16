export interface Env {
  APP_VERSION?: string;
}

type WorkerHandler<TEnv> = {
  fetch(request: Request, env: TEnv): Promise<Response>;
};

type ParkId = "disneyland" | "california-adventure";
type UpstreamQueue = {
  STANDBY?: { waitTime?: number | null };
  RETURN_TIME?: { state?: string; returnStart?: string | null; returnEnd?: string | null };
  PAID_RETURN_TIME?: { state?: string; returnStart?: string | null; returnEnd?: string | null };
};
type UpstreamItem = { id?: string; name?: string; entityType?: string; status?: string; queue?: UpstreamQueue; lastUpdated?: string };
type UpstreamPayload = { liveData?: UpstreamItem[] };

const PARK_SOURCE_IDS: Record<ParkId, string> = {
  disneyland: "7340550b-c14d-4def-80bb-acdb51d49a66",
  "california-adventure": "832fcd51-ea19-4e77-85c7-75d5843b127c",
};

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    ...init.headers,
  },
});

const operatingStatus = (status: string | undefined) => {
  if (status === "OPERATING") return "operating" as const;
  if (status === "DOWN") return "down" as const;
  if (status === "CLOSED") return "closed" as const;
  if (status === "REFURBISHMENT") return "refurbishment" as const;
  return "unknown" as const;
};

const returnState = (state: string | undefined) => {
  if (state === "AVAILABLE") return "available" as const;
  if (state === "TEMP_FULL") return "temp-full" as const;
  if (state === "FINISHED") return "finished" as const;
  return "unknown" as const;
};

export function normalizeLiveData(payload: UpstreamPayload, parkId: ParkId, fetchedAt: string) {
  return {
    parkId,
    source: "themeparks-wiki" as const,
    fetchedAt,
    items: (payload.liveData ?? []).filter((item) => item.entityType === "ATTRACTION" && item.id && item.name).map((item) => {
      const window = item.queue?.RETURN_TIME ?? item.queue?.PAID_RETURN_TIME;
      const wait = item.queue?.STANDBY?.waitTime;
      return {
        sourceEntityId: item.id!,
        name: item.name!,
        operatingStatus: operatingStatus(item.status),
        standbyMinutes: typeof wait === "number" ? wait : null,
        returnTime: window ? {
          state: returnState(window.state),
          start: window.returnStart ?? null,
          end: window.returnEnd ?? null,
        } : null,
        lastUpdatedAt: item.lastUpdated ?? fetchedAt,
      };
    }),
  };
}

async function queues(parkId: ParkId) {
  const fetchedAt = new Date().toISOString();
  const upstream = `https://api.themeparks.wiki/v1/entity/${PARK_SOURCE_IDS[parkId]}/live`;
  let response: Response;
  try {
    response = await fetch(upstream, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cf: { cacheEverything: true, cacheTtl: 300 },
    } as RequestInit & { cf: { cacheEverything: boolean; cacheTtl: number } });
  } catch {
    return json({ error: "Live queue provider is unavailable", code: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }
  if (!response.ok) return json({ error: "Live queue provider returned an error", code: "UPSTREAM_ERROR" }, { status: 502 });
  try {
    const normalized = normalizeLiveData(await response.json() as UpstreamPayload, parkId, fetchedAt);
    return json(normalized, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
  } catch {
    return json({ error: "Live queue provider returned invalid data", code: "UPSTREAM_INVALID" }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "content-type" } });
    }
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, service: "park-day-api", version: env.APP_VERSION ?? "development", liveData: true });
    }
    const match = url.pathname.match(/^\/api\/parks\/([^/]+)\/queues\/?$/);
    if (request.method === "GET" && match) {
      const parkId = match[1] as ParkId;
      if (!(parkId in PARK_SOURCE_IDS)) return json({ error: "Unknown park", code: "INVALID_PARK" }, { status: 400 });
      return queues(parkId);
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, { status: 404 });
    return new Response("Not found", { status: 404 });
  },
} satisfies WorkerHandler<Env>;
