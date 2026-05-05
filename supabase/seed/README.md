# Seed data

Three ways to populate the `drawings` table for local development. Pick one based on what you have and how much data you want.

| File | Source | Rows | When to use |
|------|--------|------|-------------|
| `dev_seed.sql` | Hand-curated 2024–2025 sample | ~190 | Quick start, no API access, no extra files |
| `full_history.sql` | Generated from a Powerball CSV via `import_csv.mjs` | ~1,768 | Full local testing with real history |
| (live API) | NY State Open Data API → `load_powerball_history.py` | ~1,800+ | Production deploys |

All three target the same schema and use `ON CONFLICT (draw_date) DO NOTHING`, so they can be combined or re-run without duplicating rows.

## Generating `full_history.sql` from a CSV

Drop a Powerball CSV at `~/Downloads/powerball.csv` (or pass an explicit path). Format:

```
Powerball,M,D,YYYY,n1,n2,n3,n4,n5,powerball,multiplier
```

White balls can be in any order — the importer sorts ascending. Then:

```bash
# From repo root
npm run db:import-csv
# Or with an explicit path:
node supabase/scripts/import_csv.mjs path/to/powerball.csv
```

This writes:
- `supabase/seed/full_history.sql` — psql-ready INSERT statements + a `refresh_number_stats()` call
- `supabase/seed/full_history.csv` — normalized CSV in our schema's column order (use it however you want — analytics in a notebook, etc.)

## Loading

```bash
# Apply migrations first (creates the schema)
supabase db reset       # local
# or
supabase db push        # remote

# Then load whichever seed you want:
npm run db:seed         # ~190-row dev seed
npm run db:seed:full    # ~1,768-row full history (after running db:import-csv)

# Verify
python supabase/scripts/doctor.py
```

## Why ~1,768 instead of ~1,941?

The Powerball game changed format on October 7, 2015. Before that:

- White balls: 1–59 (we use 1–69)
- Powerball: 1–35 to 1–39 (we use 1–26)

The schema's CHECK constraints reflect the **current** Powerball ranges (1–69 / 1–26). Pre-2015 drawings whose powerball value exceeds 26 are skipped automatically. The output starts from 2010-02-03 (any drawings before Oct 2015 that happen to fit the constraints) and continues to the latest date in your CSV. For analytical purity you may want to filter further to post-Oct-2015 drawings — but 1,768 rows is more than enough to exercise every algorithm.
