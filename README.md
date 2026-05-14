# Million Mind

Statistical analytics and combination generation for **Powerball** and **Mega Millions**, served as a free web app.

> **Disclaimer.** Million Mind is an entertainment and analytical-exploration application. Lottery drawings are independent random events. No algorithm or analysis can predict winning numbers or improve your odds of winning. The historical drawings are real; the future is random. Must be 18+ to play. If gambling is a problem, call 1-800-GAMBLER. Million Mind is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery Association, the Mega Millions Consortium, or any state lottery.

## What's in the app

- 9 generation algorithms — random + 8 ad-gated premium methods (frequency-weighted, gap, Markov, Monte Carlo, anti-syndication, ...)
- Server-side execution — the drawings dataset never leaves the server
- Frequency heatmaps + hot/cold rankings + top co-occurring pairs
- 2,650+ historical drawings, regenerated daily from official feeds via a scheduled GitHub Action
- Free for everyone — display ads + rewarded video pay the bills

## Repository layout

```
millionmind/
├── apps/web/                  Next.js 15 (App Router) — the entire app
│   ├── data/                  Powerball + Mega Millions JSON (server-only)
│   └── src/
│       ├── app/api/           generate, stats, drawings, quota, ad-grant
│       ├── app/(app)/         home, generate, analytics, history pages
│       └── lib/               algorithm-runner, rate-limit, analytics
├── packages/shared/           Algorithm math, types, game registry
├── scripts/refresh-drawings.mjs   Pulls latest drawings from NY State Open Data
└── .github/workflows/         Daily refresh action (12:00 UTC)
```

## Development

```bash
npm install                                 # workspaces install
npm run web                                 # next dev on :3000
```

```bash
npm run typecheck                           # tsc --noEmit across all packages
npm run build                               # full production build
npm run data:refresh                        # regenerate drawings JSON locally
```

## Deployment

The app is built to run on Vercel (Next.js + Vercel KV for rate-limit state).

- Hosting: Vercel (free tier sufficient for v1)
- Storage: Vercel KV (Redis-compatible REST). The rate-limit library falls back to in-memory in dev.
- Daily data refresh: GitHub Action commits regenerated JSON to `main` → Vercel auto-redeploys
- Geo-block: server-side at `/api/generate` reads Vercel/Cloudflare geo headers
- Domain: any custom domain with auto-HTTPS

## License

See the disclaimer at the top of this file. This codebase is published for transparency. Lottery / gambling-adjacent regulations vary by jurisdiction — if you fork this for a different lottery game or geography, consult an attorney about the legal posture before launching.
