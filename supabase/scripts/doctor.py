"""
Million Mind - Database Doctor
==============================
Pre-flight check for the Powerball data loaders. Verifies:
  1. DATABASE_URL is set and reachable
  2. Required tables exist (drawings, number_stats, profiles, etc.)
  3. refresh_number_stats() function exists
  4. Current row counts in drawings and number_stats

Run this BEFORE load_powerball_history.py to catch config issues
without paying the cost of the API pull.

USAGE:
    pip install -r requirements.txt
    export DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
    python supabase/scripts/doctor.py
"""

from __future__ import annotations

import os
import sys

import psycopg2

try:
    from dotenv import load_dotenv  # type: ignore[import-not-found]
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
except ImportError:
    pass

REQUIRED_TABLES = ["drawings", "profiles", "generated_combinations", "usage_limits", "number_stats"]
REQUIRED_FUNCTIONS = ["refresh_number_stats", "increment_usage_if_allowed", "handle_new_user"]


def check(condition: bool, ok_msg: str, fail_msg: str) -> bool:
    icon = "[ OK ]" if condition else "[FAIL]"
    print(f"  {icon}  {ok_msg if condition else fail_msg}")
    return condition


def main() -> int:
    print("\nMillion Mind - Database Doctor")
    print("=" * 60)

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("\n[FAIL] DATABASE_URL is not set.")
        print("       Set it in .env.local at the repo root, or export it:")
        print("         export DATABASE_URL='postgresql://...supabase.co:5432/postgres'")
        return 1

    masked = db_url.split("@")[-1] if "@" in db_url else "<unknown>"
    print(f"\nConnecting to: {masked}")

    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
    except psycopg2.OperationalError as e:
        print(f"\n[FAIL] Could not connect: {e}")
        return 1

    print("[ OK ]  Connection established\n")

    failures = 0
    try:
        with conn.cursor() as cur:
            print("Tables:")
            for table in REQUIRED_TABLES:
                cur.execute(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name = %s)",
                    (table,),
                )
                exists = bool(cur.fetchone()[0])
                if not check(exists, f"public.{table}", f"public.{table} (run `supabase db push`)"):
                    failures += 1

            print("\nFunctions:")
            for fn in REQUIRED_FUNCTIONS:
                cur.execute(
                    "SELECT EXISTS (SELECT 1 FROM pg_proc p "
                    "JOIN pg_namespace n ON p.pronamespace = n.oid "
                    "WHERE n.nspname = 'public' AND p.proname = %s)",
                    (fn,),
                )
                exists = bool(cur.fetchone()[0])
                if not check(exists, f"public.{fn}()", f"public.{fn}() (apply migration)"):
                    failures += 1

            print("\nData:")
            cur.execute("SELECT COUNT(*) FROM public.drawings")
            drawings_count = cur.fetchone()[0]
            print(f"  [INFO]  drawings rows: {drawings_count}")
            if drawings_count == 0:
                print("          Run `python supabase/scripts/load_powerball_history.py` "
                      "or `psql -f supabase/seed/dev_seed.sql`")

            cur.execute("SELECT COUNT(*) FROM public.number_stats")
            stats_count = cur.fetchone()[0]
            print(f"  [INFO]  number_stats rows: {stats_count}")

            if drawings_count > 0:
                cur.execute("SELECT MIN(draw_date), MAX(draw_date) FROM public.drawings")
                row = cur.fetchone()
                print(f"  [INFO]  date range: {row[0]} -> {row[1]}")

    finally:
        conn.close()

    print("\n" + "=" * 60)
    if failures > 0:
        print(f"[FAIL] {failures} check(s) failed. Fix and re-run.")
        return 1

    print("[ OK ] All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
