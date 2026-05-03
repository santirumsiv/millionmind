# Million Mind — Database Loaders

Python scripts that populate the `drawings` table from the official NY State Open Data API.

## Files

| File | Purpose |
|------|---------|
| `load_powerball_history.py` | One-time loader — pulls **complete** history (2010–present, ~1,800+ drawings) |
| `refresh_recent.py` | Weekly cron job — pulls only new drawings since last run |
| `requirements.txt` | Python dependencies |

The development seed (`supabase/seed/dev_seed.sql`) is the offline alternative — ~190 verified drawings, no API needed.

## Production setup

```bash
# 1. Install Python deps
pip install -r supabase/scripts/requirements.txt

# 2. Apply schema first (from repo root)
supabase db push

# 3. Set DATABASE_URL (point at the Supabase Postgres directly, not the API URL)
export DATABASE_URL="postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# 4. Run the loader (idempotent — safe to re-run)
python supabase/scripts/load_powerball_history.py

# 5. Schedule weekly refresh — choose one:
#    a) System cron:
crontab -e
# Add: 0 9 * * 0  /usr/bin/python /app/supabase/scripts/refresh_recent.py
#
#    b) Supabase pg_cron + the refresh-stats edge function (preferred):
#    See refresh_recent.py header for the SQL.
```

## Local development

Use the SQL seed instead — no API access required.

```bash
supabase db reset            # applies migrations
psql $SUPABASE_DB_URL -f supabase/seed/dev_seed.sql
```

## Why pre-computed stats?

Both loaders call the SQL function `refresh_number_stats()` after inserting, which populates `number_stats` with frequency, last-drawn date, and gap days for every number. Without this, every "hot numbers" request would scan all 1,800+ drawings. With it, algorithms read from a 95-row lookup table (69 white balls + 26 powerballs).

The cache is also auto-refreshed by an `AFTER INSERT` trigger on `drawings`, so it stays current.

## Reminder

The data is real and verified, but the algorithms built on top of it cannot predict future drawings — Powerball draws are independent random events. The historical data powers the **analytics** features (heatmaps, frequency charts, pattern visualizations) that justify the tier pricing. Mathematical odds remain 1 in 292,201,338 regardless of which numbers a user picks.
