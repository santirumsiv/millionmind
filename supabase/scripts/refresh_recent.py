"""
Million Mind - Weekly Refresh Job
==================================
Fetches only NEW drawings since the most recent one in the database,
then refreshes the statistics cache.

Powerball draws Mon/Wed/Sat at ~10:59pm ET, so a Sunday morning run
catches everything from the prior week.

Schedule via cron:
    0 9 * * 0  /usr/bin/python /app/supabase/scripts/refresh_recent.py >> /var/log/millionmind.log 2>&1

Or via Supabase pg_cron (preferred for production):
    SELECT cron.schedule('refresh-powerball', '0 9 * * 0',
      $$ SELECT net.http_post(
            url := 'https://PROJECT.functions.supabase.co/refresh-stats',
            headers := jsonb_build_object('Authorization', 'Bearer SECRET')
         ) $$);
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta
from typing import Any

import psycopg2
import requests

try:
    from dotenv import load_dotenv  # type: ignore[import-not-found]
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
except ImportError:
    pass

# Re-use parsing/insertion logic from the full loader
from load_powerball_history import insert_drawings, parse_drawing, refresh_stats

API_ENDPOINT = "https://data.ny.gov/resource/d6yy-54nr.json"
DATABASE_URL = os.environ.get("DATABASE_URL")
APP_TOKEN = os.environ.get("SOCRATA_APP_TOKEN")


def get_latest_date(conn) -> str:
    with conn.cursor() as cur:
        cur.execute("SELECT MAX(draw_date) FROM public.drawings")
        result = cur.fetchone()[0]
        if result is None:
            return (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        return result.strftime("%Y-%m-%d")


def fetch_since(date_str: str) -> list[dict[str, Any]]:
    headers = {"X-App-Token": APP_TOKEN} if APP_TOKEN else {}
    params = {
        "$where": f"draw_date > '{date_str}'",
        "$order": "draw_date ASC",
        "$limit": 100,
    }
    response = requests.get(API_ENDPOINT, params=params, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()


def main() -> None:
    if not DATABASE_URL:
        sys.exit("ERROR: DATABASE_URL not set")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        latest = get_latest_date(conn)
        print(f"Latest drawing in DB: {latest}")

        new_raw = fetch_since(latest)
        print(f"New drawings available: {len(new_raw)}")

        if not new_raw:
            print("Nothing to update.")
            return

        parsed = [d for d in (parse_drawing(r) for r in new_raw) if d is not None]
        if not parsed:
            print("No valid drawings parsed.")
            return

        insert_drawings(conn, parsed)
        refresh_stats(conn)
        print(f"Added {len(parsed)} new drawings and refreshed cache")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
