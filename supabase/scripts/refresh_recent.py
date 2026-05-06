"""
Million Mind - Multi-game refresh fallback
===========================================
Fetches new drawings for ALL games we know about and inserts anything
newer than what's already in the DB. Game-aware: adding a third game
means appending to GAME_CONFIGS below.

This is an out-of-band fallback for when the Supabase Edge Function
`refresh-drawings` isn't running (development, debugging, manual catch-up).
For production, prefer scheduling the Edge Function via pg_cron — see
supabase/migrations/20260505060000_pg_cron_setup.sql.

Schedule via system cron if you go this path:
    15 */4 * * *  /usr/bin/python /app/supabase/scripts/refresh_recent.py >> /var/log/mm.log 2>&1
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Literal

import psycopg2
import requests
from psycopg2.extras import execute_batch

try:
    from dotenv import load_dotenv  # type: ignore[import-not-found]
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
except ImportError:
    pass

DATABASE_URL = os.environ.get("DATABASE_URL")
APP_TOKEN = os.environ.get("SOCRATA_APP_TOKEN")


@dataclass
class GameConfig:
    """Mirror of the per-game source config in packages/shared/src/games.ts."""
    id: str
    name: str
    endpoint: str
    format: Literal["powerball", "split"]
    white_min: int
    white_max: int
    special_min: int
    special_max: int
    special_field: str | None = None  # only for "split" format
    multiplier_field: str = "multiplier"


GAMES: list[GameConfig] = [
    GameConfig(
        id="powerball",
        name="Powerball",
        endpoint="https://data.ny.gov/resource/d6yy-54nr.json",
        format="powerball",
        white_min=1, white_max=69,
        special_min=1, special_max=26,
    ),
    GameConfig(
        id="megamillions",
        name="Mega Millions",
        endpoint="https://data.ny.gov/resource/5xaw-6ayf.json",
        format="split",
        white_min=1, white_max=70,
        special_min=1, special_max=25,
        special_field="mega_ball",
    ),
]


def get_latest_date(conn, game_id: str) -> str:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT MAX(draw_date) FROM public.drawings WHERE game = %s",
            (game_id,),
        )
        result = cur.fetchone()[0]
        if result is None:
            return (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        return result.strftime("%Y-%m-%d")


def fetch_since(game: GameConfig, date_str: str) -> list[dict[str, Any]]:
    headers = {"X-App-Token": APP_TOKEN} if APP_TOKEN else {}
    params = {
        "$where": f"draw_date > '{date_str}T00:00:00'",
        "$order": "draw_date ASC",
        "$limit": 200,
    }
    response = requests.get(game.endpoint, params=params, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()


def parse_drawing(game: GameConfig, raw: dict[str, Any]) -> dict[str, Any] | None:
    try:
        date_str = raw["draw_date"].split("T")[0]
        draw_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        tokens = raw["winning_numbers"].split()

        if game.format == "powerball":
            if len(tokens) != 6:
                return None
            whites = sorted(int(n) for n in tokens[:5])
            special = int(tokens[5])
        else:  # split
            if len(tokens) != 5:
                return None
            whites = sorted(int(n) for n in tokens)
            special_raw = raw.get(game.special_field or "")
            if special_raw is None:
                return None
            special = int(special_raw)

        if any(n < game.white_min or n > game.white_max for n in whites):
            return None
        if not (game.special_min <= special <= game.special_max):
            return None
        if len(set(whites)) != 5:
            return None

        multiplier_raw = raw.get(game.multiplier_field)
        try:
            multiplier = int(multiplier_raw) if multiplier_raw else 1
        except (TypeError, ValueError):
            multiplier = 1
        multiplier = max(1, min(10, multiplier))

        return {
            "game": game.id,
            "draw_date": draw_date,
            "n1": whites[0],
            "n2": whites[1],
            "n3": whites[2],
            "n4": whites[3],
            "n5": whites[4],
            "powerball": special,
            "multiplier": multiplier,
        }
    except (KeyError, ValueError, AttributeError) as e:
        print(f"  [{game.id}] skipping malformed record: {e}")
        return None


def insert_drawings(conn, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    sql = """
        INSERT INTO public.drawings
          (game, draw_date, n1, n2, n3, n4, n5, powerball, multiplier)
        VALUES
          (%(game)s, %(draw_date)s, %(n1)s, %(n2)s, %(n3)s, %(n4)s,
           %(n5)s, %(powerball)s, %(multiplier)s)
        ON CONFLICT (game, draw_date) DO NOTHING
    """
    with conn.cursor() as cur:
        execute_batch(cur, sql, rows, page_size=200)
    conn.commit()


def refresh_stats(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT public.refresh_number_stats();")
    conn.commit()


def main() -> None:
    if not DATABASE_URL:
        sys.exit("ERROR: DATABASE_URL not set")

    conn = psycopg2.connect(DATABASE_URL)
    total_inserted = 0
    try:
        for game in GAMES:
            latest = get_latest_date(conn, game.id)
            print(f"\n[{game.id}] latest in DB: {latest}")
            try:
                raw = fetch_since(game, latest)
            except Exception as e:
                print(f"[{game.id}] fetch failed: {e}")
                continue
            print(f"[{game.id}] new drawings available: {len(raw)}")
            if not raw:
                continue
            parsed = [r for r in (parse_drawing(game, r) for r in raw) if r is not None]
            if not parsed:
                print(f"[{game.id}] no valid rows after parsing")
                continue
            insert_drawings(conn, parsed)
            total_inserted += len(parsed)
            print(f"[{game.id}] inserted {len(parsed)} new drawings")

        if total_inserted > 0:
            refresh_stats(conn)
            print(f"\nTotal inserted: {total_inserted}. Stats cache refreshed.")
        else:
            print("\nNothing new across any game.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
