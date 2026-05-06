# Million Mind — Supabase Backend

Single backend for iOS, Android, and web. Postgres schema + Edge Functions running the algorithm engine.

## Layout

```
supabase/
├── config.toml                  Supabase CLI local-dev config
├── migrations/
│   └── 20260101000000_initial_schema.sql
├── seed/
│   └── dev_seed.sql             ~190 verified drawings, no internet needed
├── scripts/                     Python ops scripts (out-of-band, not Edge Functions)
│   ├── doctor.py                Pre-flight DB check
│   ├── load_powerball_history.py   ~1,800 drawings since 2010
│   ├── refresh_recent.py        Weekly delta loader
│   └── requirements.txt
└── functions/                   Edge Functions (Deno runtime)
    ├── _shared/                 cors, tiers, disclaimer, algorithms
    ├── generate-numbers/        Tier-gated number generation, all 7 algorithms
    ├── revenuecat-webhook/      RC events → profiles.tier sync
    └── refresh-stats/           Manual cache refresh
```

## Stage 03 — Data load runbook

Run these in order. The doctor script fails fast if anything is missing.

```bash
# 1. Set credentials in .env.local (at repo root)
#    DATABASE_URL = direct Postgres connection (not the API URL)
#    SUPABASE_DB_URL = same value
#    Get from Supabase dashboard → Project Settings → Database → Connection string (URI)

# 2. Install Python deps once
pip install -r supabase/scripts/requirements.txt

# 3. Apply schema (creates 5 tables + RLS + triggers + functions)
supabase link --project-ref YOUR_REF       # one-time
supabase db push                           # applies 20260101000000_initial_schema.sql

# 4. Pre-flight check
python supabase/scripts/doctor.py
# Expect: 5 tables OK, 3 functions OK, drawings=0

# 5. Choose ONE seed path:
#
#    Production — full ~1,800 drawing history from NY State API (~2 min):
python supabase/scripts/load_powerball_history.py

#    Dev / offline — 190 verified drawings, no API needed:
psql "$DATABASE_URL" -f supabase/seed/dev_seed.sql

# 6. Verify
python supabase/scripts/doctor.py
# Expect: drawings ≈ 1843 (prod) or 190 (dev), number_stats = 95
```

## Stage 03 — Edge Functions deploy

```bash
supabase secrets set \
  REVENUECAT_WEBHOOK_SECRET=$(openssl rand -hex 32) \
  REFRESH_STATS_SECRET=$(openssl rand -hex 32) \
  REFRESH_DRAWINGS_SECRET=$(openssl rand -hex 32) \
  REMINDER_FUNCTION_SECRET=$(openssl rand -hex 32)

supabase functions deploy generate-numbers
supabase functions deploy revenuecat-webhook
supabase functions deploy refresh-stats
supabase functions deploy refresh-drawings
supabase functions deploy send-drawing-reminders
supabase functions deploy claim-rewarded-bonus
```

## Auto-refresh drawings (production)

The `refresh-drawings` Edge Function pulls new drawings for **every game in the registry** from each game's official data feed and inserts anything newer than what's in the DB. Game-aware — adding a third game (Cash4Life, Lucky for Life, etc.) means extending `packages/shared/src/games.ts` + `_shared/games.ts`; this function picks them up automatically.

Schedule it via `pg_cron`. The migration `20260505060000_pg_cron_setup.sql` documents the SQL — run it once in the SQL editor (after replacing `YOUR_PROJECT_REF` and the bearer secret values):

```sql
-- Auto-refresh drawings every 4 hours.
SELECT cron.schedule(
  'refresh-drawings',
  '15 */4 * * *',
  $$SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.functions.supabase.co/refresh-drawings',
      headers := jsonb_build_object('Authorization', 'Bearer YOUR_REFRESH_DRAWINGS_SECRET')
    )$$
);
```

**Option B: external cron / GitHub Actions:**

```bash
# crontab -e
0 9 * * 0  cd /app && python supabase/scripts/refresh_recent.py >> /var/log/millionmind.log 2>&1
```

## Schema overview

| Table | Purpose | RLS |
|-------|---------|-----|
| `drawings` | Historical Powerball draws (2010–present) | Public read; writes via service role |
| `profiles` | One row per auth.users; holds tier | Owner read/update |
| `generated_combinations` | Audit log of every tier-gated generation | Owner read |
| `usage_limits` | Atomic weekly counter, enforced server-side | Owner read |
| `number_stats` | Pre-computed cache (frequency/gap/last-drawn) | Public read; refresh via service role |

Trigger on `auth.users` INSERT auto-creates a `profiles` row at tier `free`. Trigger on `drawings` INSERT auto-refreshes `number_stats`.

## Tier gating (server-enforced)

Edge function `generate-numbers` reads `profiles.tier`, checks the requested algorithm against `TIER_ALGORITHMS`, and atomically increments the weekly counter via `increment_usage_if_allowed(user, week_start, cap)`. Returns:

- `403` `TIER_LOCKED` — algorithm not unlocked at user's tier
- `429` `RATE_LIMITED` — weekly cap reached; resets next Monday UTC
- `200` `{ white_balls, powerball, algorithm, generated_at, remaining_this_week, disclaimer }`

Every successful response carries the disclaimer string. Do not strip it client-side.

## Reminder

The data is real and verified, but algorithms cannot predict future drawings — Powerball draws are independent random events. The historical data powers the **analytics** features (heatmaps, frequency charts, pattern visualizations) that justify tier pricing. Mathematical odds remain 1 in 292,201,338 regardless of which numbers a user picks.
