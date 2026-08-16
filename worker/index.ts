export interface Env {
  APP_VERSION?: string;
}

type WorkerHandler<TEnv> = {
  fetch(request: Request, env: TEnv): Promise<Response>;
};

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...init.headers },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, service: "park-day-api", version: env.APP_VERSION ?? "development", liveData: false });
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, { status: 404 });
    return new Response("Not found", { status: 404 });
  },
} satisfies WorkerHandler<Env>;
