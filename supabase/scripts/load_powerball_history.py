"""
Million Mind - Historical Data Loader
======================================
Pulls ALL historical Powerball drawings (2010 - present) from the
NY State Open Data API and loads them into the Supabase Postgres database.

Run this ONCE during initial deployment. After that, schedule
`refresh_recent.py` as a weekly cron job.

USAGE:
    pip install -r requirements.txt
    export DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
    python supabase/scripts/load_powerball_history.py

NY Open Data API:
    Endpoint:   https://data.ny.gov/resource/d6yy-54nr.json
    Dataset:    "Lottery Powerball Winning Numbers: Beginning 2010"
    Format:     JSON: draw_date, winning_numbers (space-sep), multiplier
    Auth:       not required (~1000 req/hr without app token)

The schema (drawings + number_stats + refresh_number_stats()) must already
exist; apply via `supabase db push` first.
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime
from typing import Any

import psycopg2
import requests
from psycopg2.extras import execute_batch

try:
    from dotenv import load_dotenv  # type: ignore[import-not-found]
    load_dotenv()
    # Also try loading from repo root
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
except ImportError:
    pass


API_ENDPOINT = "https://data.ny.gov/resource/d6yy-54nr.json"
PAGE_SIZE = 1000
DATABASE_URL = os.environ.get("DATABASE_URL")
APP_TOKEN = os.environ.get("SOCRATA_APP_TOKEN")


def fetch_all_drawings() -> list[dict[str, Any]]:
    """Paginate through the entire NY Open Data API."""
    all_drawings: list[dict[str, Any]] = []
    offset = 0
    headers = {"X-App-Token": APP_TOKEN} if APP_TOKEN else {}

    print("Fetching historical Powerball drawings from NY State Open Data...")

    while True:
        params = {
            "$limit": PAGE_SIZE,
            "$offset": offset,
            "$order": "draw_date ASC",
        }
        response = requests.get(API_ENDPOINT, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        batch = response.json()
        if not batch:
            break

        all_drawings.extend(batch)
        print(f"  Fetched {len(all_drawings)} drawings so far...")

        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
        time.sleep(0.1)

    print(f"\nTotal drawings retrieved: {len(all_drawings)}")
    return all_drawings


def parse_drawing(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Parse one raw API record into our schema; return None if malformed."""
    try:
        date_str = raw["draw_date"].split("T")[0]
        draw_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        nums = raw["winning_numbers"].split()
        if len(nums) != 6:
            return None

        whites = sorted(int(n) for n in nums[:5])
        powerball = int(nums[5])

        if not all(1 <= n <= 69 for n in whites):
            return None
        if not (1 <= powerball <= 26):
            return None
        if len(set(whites)) != 5:
            return None

        multiplier_raw = raw.get("multiplier")
        try:
            multiplier = int(multiplier_raw) if multiplier_raw else 1
        except (TypeError, ValueError):
            multiplier = 1
        multiplier = max(1, min(10, multiplier))

        return {
            "draw_date": draw_date,
            "n1": whites[0],
            "n2": whites[1],
            "n3": whites[2],
            "n4": whites[3],
            "n5": whites[4],
            "powerball": powerball,
            "multiplier": multiplier,
        }
    except (KeyError, ValueError, AttributeError) as e:
        print(f"  Skipping malformed record: {e}")
        return None


def insert_drawings(conn, drawings: list[dict[str, Any]]) -> None:
    """Bulk-insert with ON CONFLICT for idempotency."""
    sql = """
        INSERT INTO public.drawings (draw_date, n1, n2, n3, n4, n5, powerball, multiplier)
        VALUES (%(draw_date)s, %(n1)s, %(n2)s, %(n3)s, %(n4)s,
                %(n5)s, %(powerball)s, %(multiplier)s)
        ON CONFLICT (draw_date) DO NOTHING
    """
    with conn.cursor() as cur:
        execute_batch(cur, sql, drawings, page_size=500)
    conn.commit()
    print(f"Inserted/skipped {len(drawings)} drawings")


def refresh_stats(conn) -> None:
    """Call the SQL function rather than reimplementing — keeps logic in one place."""
    with conn.cursor() as cur:
        cur.execute("SELECT public.refresh_number_stats();")
    conn.commit()
    print("Pre-computed frequency cache refreshed")


def main() -> None:
    if not DATABASE_URL:
        print("ERROR: Set DATABASE_URL environment variable", file=sys.stderr)
        print(
            "  Example: export DATABASE_URL='postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres'",
            file=sys.stderr,
        )
        sys.exit(1)

    raw_drawings = fetch_all_drawings()
    parsed = [d for d in (parse_drawing(r) for r in raw_drawings) if d is not None]

    print(f"\nSuccessfully parsed {len(parsed)} drawings")
    if parsed:
        print(f"  Date range: {parsed[0]['draw_date']} -> {parsed[-1]['draw_date']}")

    print("\nConnecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    try:
        insert_drawings(conn, parsed)
        refresh_stats(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM public.drawings")
            count = cur.fetchone()[0]
            print(f"\nDatabase now contains {count} drawings")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
