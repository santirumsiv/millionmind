# Million Mind

Powerball **statistics & entertainment** platform — three client surfaces sharing one Supabase backend.

> **Disclaimer.** Million Mind is an entertainment and statistical analysis application. Powerball drawings are independent random events. No algorithm or analysis can predict winning numbers or improve your odds of winning, which remain 1 in 292,201,338 for the jackpot regardless of which numbers you choose. This app is for entertainment purposes only. Must be 18+ to play Powerball. If gambling is a problem, call 1-800-GAMBLER. Million Mind is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery Association or any state lottery.

## Repository layout

```
millionmind/
├── apps/
│   ├── mobile/        Expo + React Native (iOS + Android)
│   └── web/           Next.js 15 (App Router)
├── packages/
│   └── shared/        Types, constants, tier logic, algorithm names
├── supabase/
│   ├── migrations/    SQL migrations
│   ├── functions/     Edge Functions (Deno) — algorithms run here
│   ├── seed/          Dev seed data (~190 verified drawings)
│   └── scripts/       Python loaders (history + weekly refresh)
├── turbo.json
└── package.json       npm workspaces
```

## Prerequisites

- Node.js 20+ and npm 10+
- Python 3.10+ (only for `supabase/scripts/`)
- Supabase CLI (`npm i -g supabase` or [direct install](https://supabase.com/docs/guides/local-development/cli/getting-started))
- iOS Simulator (Xcode) and/or Android Emulator (Android Studio) for mobile

## First-time setup

```bash
# 1. Install dependencies (uses npm workspaces)
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Apply Supabase schema
supabase db push       # remote
# OR for local dev:
supabase start && supabase db reset

# 4. Seed dev data (~190 drawings, no internet needed)
npm run db:seed

# 5. (Optional, production) Load full ~1,800 drawing history
pip install -r supabase/scripts/requirements.txt
npm run db:load-history
```

## Run the apps

```bash
# Web — http://localhost:3000
npm run web

# Mobile — opens Expo dev server, scan QR with Expo Go or press i / a
npm run mobile

# Both at once
npm run dev
```

## Architecture

**Single backend** — Supabase (Postgres + Auth + Edge Functions). All seven number-generation algorithms run server-side as Edge Functions; clients never see the math, and tier-gating is enforced at the API.

**Tiers** (RevenueCat-managed entitlements):

| Tier | Tag | Price | Algorithms | Weekly cap |
|------|-----|-------|-----------|-----------|
| Explorer | Free | $0 | random | 3 |
| Analyst | Starter | $7.99/mo | random, hot, cold | 10 |
| Strategist | Pro | $19.99/mo | + gap, pattern | 50 |
| Data Scientist | Elite | $39.99/mo | + markov, monte_carlo | unlimited |

## Compliance reminders

- **Never** imply algorithms improve odds. Frame everything as analysis/insights/entertainment.
- Display the disclaimer on every screen and as the first paragraph of every store listing.
- Sign in with Apple is **required** on iOS if any other social sign-in is offered.
- Geo-block Utah and Hawaii at signup (per attorney guidance).
- Age 17+ on iOS, Mature on Android.

See `.claude/` and the original spec docs for the full legal framework.
