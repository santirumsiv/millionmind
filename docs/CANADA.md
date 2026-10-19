# Million Mind — Canada (CA) section

The `/ca` section adds Canadian draw games alongside the existing US Powerball /
Mega Millions app. Use the **🇺🇸 US / 🇨🇦 CA toggle** at the top-right of either
header to switch.

## Games

| Game | Matrix | Bonus | Draw days | Backend |
|------|--------|-------|-----------|---------|
| Lotto Max | 7 / 1–50 | Bonus from main pool | Tue, Fri | FastAPI :8000 |
| Lotto 6/49 | 6 / 1–49 | Bonus from main pool | Wed, Sat | FastAPI :8000* |
| Daily Grand | 5 / 1–49 | Grand Number 1–7 (separate pool) | Mon, Thu | Flask :5051 |

\* Lotto 6/49 and Lotto Max are distinct services; see ports below.

## Architecture

The US app is a single Next.js deployment with its algorithms in
`packages/shared` (TypeScript). **The Canadian games now work the same way** —
History, Analytics, and Generate all compute from the in-codebase draw history
(`apps/web/data/ca-*.json`), with no Python services required:

```
Browser ── /ca pages ──> Next.js API routes ──> in-codebase data + shared engine
                         /api/ca/[game]/stats      ca-runner.ts ─┐
                         /api/ca/[game]/generate   ca-runner.ts ─┤─ @millionmind/shared
                         /api/ca/[game]/drawings   ca-history.ts ┘   (ca-algorithms.ts)
                                                   reads apps/web/data/ca-*.json
```

- [`ca-algorithms.ts`](../packages/shared/src/ca-algorithms.ts) — the portable CA
  engine (the CA counterpart of `algorithms-impl.ts`): `computeCaStats` (frequency,
  hot/cold/overdue 10, per-pool stats), `computeCaTopPairs` (co-occurring main
  pairs), and `generateCaTickets` (balanced / hot / cold / overdue / pairs / random
  / auto, generalized to a variable main count + main-pool or separate bonus).
- [`ca-runner.ts`](../apps/web/src/lib/ca-runner.ts) — server-side loader that
  imports the JSON, computes stats once at cold start, and runs generation.

**Legacy:** the Python-proxy adapter
[`ca-backends.ts`](../apps/web/src/lib/ca-backends.ts) (FastAPI :8000 / Flask :5050
/ :5051, normalized via env `CA_*_API_URL`) is kept but **no longer wired** — to
proxy the live Python services instead, point the stats/generate routes back at
`caStats` / `caGenerate`. The Python backends are never modified.

## Running locally

1. **Backends** — each game's repo has its own virtualenv:

   - `649winner/backend`   → `venv/bin/python main.py` (ships ~4,385 real draws)
   - `dailygrand win/backend` → `.venv/bin/python app.py` (preloads embedded history)
   - `lottomaxwin/backend` → `venv/bin/python app.py` (needs a draw file — see below)

   Or start all three at once:

   ```bash
   ./scripts/start-ca-backends.sh
   # override locations with LOTTO649_DIR / LOTTOMAX_DIR / DAILYGRAND_DIR
   ```

2. **Web app**

   ```bash
   npm run web        # http://localhost:3000/ca
   ```

## Loading draw data

- **Lotto 6/49** — ships `backend/data/draws.csv`; loaded automatically on start.
- **Daily Grand** — preloads embedded history on start (no upload needed).
- **Lotto Max** — starts empty; load the OLG "Since Inception" PDF:

  ```bash
  curl -F "file=@LottoMax-SinceInception.pdf" http://localhost:5050/api/upload
  ```

  Daily Grand also accepts CSV/PDF uploads at
  `POST http://localhost:5051/api/games/DG/upload` if you want to replace the
  embedded data.

When a backend is up but has no data loaded, `/api/ca/<game>/stats` returns a
valid `loaded: false` payload and the Analytics page shows a "load data" prompt.
When a backend is down, the route returns `503 BACKEND_DOWN` and the UI surfaces
a "start the backend" message.

## History tab (in-codebase draw data)

The **History** tab (`/ca/history`) does **not** use the Python backends. Like
the US side (which ships `apps/web/data/powerball.json`), each Canadian game
ships its full official draw history as a static JSON file:

| Game | File | Draws | Since |
|------|------|-------|-------|
| Lotto 6/49 | `apps/web/data/ca-lotto649.json` | ~2,741 | 1982-06-12 |
| Lotto Max | `apps/web/data/ca-lottomax.json` | ~1,212 | 2009-09-25 |
| Daily Grand | `apps/web/data/ca-dailygrand.json` | ~976 | 2016-10-20 |

Row shape: `{ "draw_date": "YYYY-MM-DD", "main": number[], "bonus": number }`
(variable `main` length: 6 / 7 / 5). The loader
[`apps/web/src/lib/ca-history.ts`](../apps/web/src/lib/ca-history.ts) imports
them server-side and `/api/ca/[game]/drawings?limit=N` serves the most-recent N
(newest-first) — mirroring `/api/drawings` for the US games.

### Keeping it current (auto-refresh)

The deep history is **seeded once** from the OLG "Since Inception" PDFs:

```bash
~/projects/lottomaxwin/backend/venv/bin/python scripts/parse-ca-draws.py
# override PDF paths with LOTTO649_PDF / LOTTOMAX_PDF / DAILYGRAND_PDF
```

The parser skips MaxMillions / Bonus Draw / Super Draw side-draws and the
EXTRA/GPD prize columns, and handles the Lotto Max 49→50 pool change on
2019-05-14.

It is then **kept current** the same way the US games are. The US side fetches a
clean public JSON API (NY State Open Data); the OLG has no equivalent, so the CA
refresher scrapes the latest draws from **WCLC** (Western Canada Lottery Corp),
which publishes official winning numbers for all three games:

```bash
npm run data:refresh:ca   # node scripts/refresh-ca-draws.mjs
```

This **merges** — the full PDF-seeded history is preserved; WCLC's most-recent
draws (~8 per game) are added, deduped by date, re-sorted, and the JSON is
rewritten (idempotent). The daily GitHub Action
[`refresh-drawings.yml`](../.github/workflows/refresh-drawings.yml) runs both the
US and CA refreshers at 12:00 UTC, commits, and pushes (Vercel redeploys).

So the History tab works with **no backends running** — only Generate and
Analytics need the live Python services.

> **One-time gap:** WCLC only exposes the last ~8 draws, so if the PDF snapshot
> is stale, draws between the PDF's last date and WCLC's oldest visible draw are
> missing until back-filled. To close such a gap, re-export fresh "Since
> Inception" PDFs and re-run `parse-ca-draws.py`, then `data:refresh:ca`. Going
> forward, the daily cron leaves no gaps.

## Deployment note

These Python services are long-running processes and do **not** run on Vercel's
serverless functions as-is. For production, host them separately (Fly.io, Render,
a VM, containers) and point the `CA_*_API_URL` env vars at those hosts. The
in-memory draw cache in the Flask services should be backed by a database or
Redis for a real deployment.
