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

Deploy from `worker/wrangler.toml`, then route `maxfieldfriedman.com/api/*` to the Worker. The Worker exposes `GET /api/health` and `GET /api/parks/{parkId}/queues`. Queue data is normalized from ThemeParks.wiki and cached upstream for five minutes. The client refreshes it only when requested.

## Reliability

The Disneyland app remains authoritative for transactions and eligibility. Live waits, availability, and advertised return windows can be refreshed through the Queues tab, while bookings and corrections remain manually editable. The PWA stores personal trip data in the browser and continues from cached data offline; separate devices do not share personal trip state.

The Map tab is a bundled schematic based on approximate attraction coordinates. It requires no map tiles or network connection and is intended for relative positioning, not turn-by-turn navigation.
