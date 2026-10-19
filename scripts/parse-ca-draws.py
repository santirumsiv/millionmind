#!/usr/bin/env python3
"""
Parse the three OLG "Since Inception" PDFs into JSON draw-history files for the
Million Mind CA section, mirroring how the US side ships static data files
(apps/web/data/powerball.json).

Source PDFs (override paths with env vars LOTTO649_PDF / LOTTOMAX_PDF / DAILYGRAND_PDF):
    ~/Downloads/LOTTO 649 SINCE INCEPTION.pdf
    ~/Downloads/LOTTO MAX since Inception.pdf
    ~/Downloads/DAILY GRAND Since Inception.pdf

Output (apps/web/data/):
    ca-lotto649.json
    ca-lottomax.json
    ca-dailygrand.json

Each file: { game, generated_at, count, date_range, rows: [{draw_date, main[], bonus}] }
  - lotto649   : 6 main (1-49) + bonus (1-49, from same pool)
  - lottomax   : 7 main (1-50/1-49 pre-2019-05-14) + bonus (same pool)
  - dailygrand : 5 main (1-49) + bonus = Grand Number (1-7, separate pool)

MaxMillions / Bonus Draw / Super Draw side-draws and the EXTRA/GPD prize columns
are intentionally skipped — only the official main winning numbers are kept.

Requires: pdfplumber  (present in the lottomaxwin backend venv)
Run:  ~/projects/lottomaxwin/backend/venv/bin/python scripts/parse-ca-draws.py
"""

import io
import json
import os
import re
from datetime import datetime, timezone

import pdfplumber

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

DATE_RE = re.compile(
    r"^(January|February|March|April|May|June|July|August|"
    r"September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})\b(.*)$",
    re.I,
)

# Lines that are never a main-draw row.
SKIP_RE = re.compile(
    r"(LOTTO\s*MAX|LOTTO\s*6/49|DAILY\s*GRAND|SINCE\s*INCEPTION|In the event|"
    r"prevail|Draw\s*#|Maxmillions|Max\s+Millions|Bonus\s*Draw|Super\s*Draw|"
    r"^Page\b|THE PLUS|^Bonus\b)",
    re.I,
)


def _ints(rest: str):
    """Leading run of integers on a line, stopping at the first big (prize) token."""
    out = []
    for tok in rest.split():
        clean = re.sub(r"[^\d]", "", tok)
        if not clean:
            continue
        val = int(clean)
        if val > 100:  # prize / GPD / EXTRA column — main pools never exceed 50
            break
        out.append(val)
    return out


def _date(month_name, day, year):
    try:
        return datetime(int(year), MONTHS[month_name.lower()], int(day))
    except (ValueError, KeyError):
        return None


def parse(pdf_path, *, main_count, main_pool, bonus_pool, bonus_separate,
          pool_switch=None):
    """pool_switch: (date, new_pool) — Lotto Max grew 49→50 on 2019-05-14."""
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        pages = len(pdf.pages)
        for page in pdf.pages:
            text = page.extract_text() or ""
            for raw in text.splitlines():
                line = raw.strip()
                if not line or SKIP_RE.search(line):
                    continue
                m = DATE_RE.match(line)
                if not m:
                    continue
                d = _date(m.group(1), m.group(2), m.group(3))
                if not d:
                    continue

                pool = main_pool
                if pool_switch and d >= pool_switch[0]:
                    pool = pool_switch[1]

                nums = _ints(m.group(4))
                if len(nums) < main_count + 1:
                    continue
                main = nums[:main_count]
                bonus = nums[main_count]

                if len(set(main)) != main_count or any(n < 1 or n > pool for n in main):
                    continue
                if bonus_separate:
                    if not (1 <= bonus <= bonus_pool):
                        continue
                else:
                    if not (1 <= bonus <= pool) or bonus in main:
                        continue

                rows.append({
                    "date": d,
                    "draw_date": d.strftime("%Y-%m-%d"),
                    "main": sorted(main),
                    "bonus": bonus,
                })

    # Dedup by date (page overlaps), sort oldest-first.
    by_date = {r["date"]: r for r in rows}
    ordered = sorted(by_date.values(), key=lambda r: r["date"])
    for r in ordered:
        del r["date"]
    return ordered, pages


def main():
    home = os.path.expanduser("~")
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(here, "apps", "web", "data")
    os.makedirs(out_dir, exist_ok=True)

    games = {
        "lotto649": {
            "pdf": os.environ.get("LOTTO649_PDF",
                                  f"{home}/Downloads/LOTTO 649 SINCE INCEPTION.pdf"),
            "kwargs": dict(main_count=6, main_pool=49, bonus_pool=49, bonus_separate=False),
        },
        "lottomax": {
            "pdf": os.environ.get("LOTTOMAX_PDF",
                                  f"{home}/Downloads/LOTTO MAX since Inception.pdf"),
            "kwargs": dict(main_count=7, main_pool=49, bonus_pool=50, bonus_separate=False,
                           pool_switch=(datetime(2019, 5, 14), 50)),
        },
        "dailygrand": {
            "pdf": os.environ.get("DAILYGRAND_PDF",
                                  f"{home}/Downloads/DAILY GRAND Since Inception.pdf"),
            "kwargs": dict(main_count=5, main_pool=49, bonus_pool=7, bonus_separate=True),
        },
    }

    now = datetime.now(timezone.utc).isoformat()
    for game, cfg in games.items():
        if not os.path.exists(cfg["pdf"]):
            print(f"⚠  {game}: PDF not found at {cfg['pdf']} — skipping")
            continue
        rows, pages = parse(cfg["pdf"], **cfg["kwargs"])
        payload = {
            "game": game,
            "generated_at": now,
            "count": len(rows),
            "date_range": (
                {"start": rows[0]["draw_date"], "end": rows[-1]["draw_date"]}
                if rows else None
            ),
            "rows": rows,
        }
        out = os.path.join(out_dir, f"ca-{game}.json")
        with open(out, "w") as f:
            json.dump(payload, f, indent=0, separators=(",", ":"))
        rng = f"{rows[0]['draw_date']} → {rows[-1]['draw_date']}" if rows else "—"
        print(f"✓  {game}: {len(rows)} draws ({pages} pages)  {rng}  → {out}")


if __name__ == "__main__":
    main()
