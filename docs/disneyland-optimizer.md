# Park Day Optimizer operations

The private trip route is `/park-day-8x4m/`. It is deliberately unlinked and marked `noindex`. Its client-side gate is an obscurity measure, not strong authentication.

The trip passphrase is `rope-drop-2026`. Change it by replacing the SHA-256 hash in `AccessGate.tsx` before deployment.

## Cloudflare Pages

- Connect the existing GitHub repository.
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `out`
- Keep `maxfieldfriedman.com` on GitHub Pages until the Cloudflare preview is verified.
- Add the custom domain in Cloudflare Pages, then remove `CNAME` and disable the GitHub Pages workflow only after the cutover succeeds.

## Worker

Deploy from `worker/wrangler.toml`, then route `maxfieldfriedman.com/api/*` to the Worker. The MVP exposes only `GET /api/health`; live data is intentionally not required by the optimizer.

## Reliability

The Disneyland app is authoritative. Confirm park closing times, attraction availability, waits, return windows, and the next-booking timer manually. The PWA stores trip data in the browser and continues from cached data offline.

The Map tab is a bundled schematic based on approximate attraction coordinates. It requires no map tiles or network connection and is intended for relative positioning, not turn-by-turn navigation.
