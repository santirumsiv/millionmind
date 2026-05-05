"""
Million Mind - CSV Importer
============================
Converts a Powerball CSV file (in the format published by various lottery
archives) into:

  1. supabase/seed/full_history.sql  — INSERT statements ready for psql -f
  2. supabase/seed/full_history.csv  — normalized CSV with our schema columns

The input format expected (one row per drawing):

    Powerball,M,D,YYYY,n1,n2,n3,n4,n5,powerball,multiplier

Where:
  - n1..n5 may be in any order; we sort them ascending before output
  - whites must be 1..69, powerball 1..26
  - multiplier defaults to 1 if missing/invalid

USAGE:

    # From repo root
    python supabase/scripts/import_csv.py /path/to/powerball.csv

    # Explicit input + output paths
    python supabase/scripts/import_csv.py \
        --input C:/Users/me/Downloads/powerball.csv \
        --sql supabase/seed/full_history.sql \
        --csv supabase/seed/full_history.csv

After running, load into local Postgres with:

    psql "$DATABASE_URL" -f supabase/seed/full_history.sql
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import date
from pathlib import Path
from typing import Iterable


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    repo_root = Path(__file__).resolve().parents[2]
    p.add_argument(
        "input",
        nargs="?",
        default=None,
        help="Path to the source Powerball CSV. If omitted, looks for ~/Downloads/powerball.csv.",
    )
    p.add_argument(
        "--input",
        dest="input_flag",
        default=None,
        help="Alternative way to provide the input path.",
    )
    p.add_argument(
        "--sql",
        default=str(repo_root / "supabase" / "seed" / "full_history.sql"),
        help="Output SQL path. Default: supabase/seed/full_history.sql",
    )
    p.add_argument(
        "--csv",
        default=str(repo_root / "supabase" / "seed" / "full_history.csv"),
        help="Output normalized CSV path. Default: supabase/seed/full_history.csv",
    )
    return p.parse_args()


def resolve_input(args: argparse.Namespace) -> Path:
    candidate = args.input or args.input_flag
    if candidate:
        return Path(candidate).expanduser().resolve()
    home_dl = Path.home() / "Downloads" / "powerball.csv"
    if home_dl.exists():
        return home_dl
    sys.exit(
        "ERROR: no input CSV found. Pass it as the first arg, --input, "
        "or place it at ~/Downloads/powerball.csv."
    )


def parse_row(raw: list[str], lineno: int) -> dict | None:
    if len(raw) < 10:
        print(f"  line {lineno}: skipped (only {len(raw)} columns)")
        return None

    # Tolerate either "Powerball,M,D,YYYY,..." or "M,D,YYYY,..." (no label)
    if raw[0].strip().lower().startswith("powerball"):
        cells = raw[1:]
    else:
        cells = raw

    if len(cells) < 9:
        print(f"  line {lineno}: skipped (only {len(cells)} numeric cells)")
        return None

    try:
        month = int(cells[0])
        day = int(cells[1])
        year = int(cells[2])
        whites = sorted(int(c) for c in cells[3:8])
        powerball = int(cells[8])
        multiplier_raw = cells[9] if len(cells) >= 10 else "1"
        try:
            multiplier = int(multiplier_raw) if multiplier_raw.strip() else 1
        except ValueError:
            multiplier = 1
        multiplier = max(1, min(10, multiplier))

        draw_date = date(year, month, day)
    except (ValueError, IndexError) as e:
        print(f"  line {lineno}: skipped — parse error ({e})")
        return None

    if not all(1 <= n <= 69 for n in whites):
        print(f"  line {lineno}: skipped — white balls out of range {whites}")
        return None
    if not (1 <= powerball <= 26):
        print(f"  line {lineno}: skipped — powerball out of range {powerball}")
        return None
    if len(set(whites)) != 5:
        print(f"  line {lineno}: skipped — duplicate whites {whites}")
        return None

    return {
        "draw_date": draw_date.isoformat(),
        "n1": whites[0],
        "n2": whites[1],
        "n3": whites[2],
        "n4": whites[3],
        "n5": whites[4],
        "powerball": powerball,
        "multiplier": multiplier,
    }


def parse_csv(path: Path) -> list[dict]:
    rows: list[dict] = []
    seen_dates: set[str] = set()
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        for i, raw in enumerate(reader, start=1):
            # Skip blank lines
            if not raw or all(not c.strip() for c in raw):
                continue
            row = parse_row(raw, i)
            if not row:
                continue
            if row["draw_date"] in seen_dates:
                # Take the first occurrence; CSV may include duplicates
                continue
            seen_dates.add(row["draw_date"])
            rows.append(row)

    rows.sort(key=lambda r: r["draw_date"])
    return rows


def write_sql(rows: Iterable[dict], path: Path) -> int:
    rows = list(rows)
    path.parent.mkdir(parents=True, exist_ok=True)
    header = (
        "-- ─────────────────────────────────────────────────────────────────────\n"
        "-- Million Mind — Full History Seed (generated by import_csv.py)\n"
        "-- ─────────────────────────────────────────────────────────────────────\n"
        "-- Generated from a Powerball CSV. Run AFTER applying the initial\n"
        "-- migration:\n"
        "--   supabase db reset                             (local)\n"
        "--   psql \"$DATABASE_URL\" -f supabase/seed/full_history.sql\n"
        "-- This file is idempotent — ON CONFLICT (draw_date) DO NOTHING.\n"
        "-- ─────────────────────────────────────────────────────────────────────\n\n"
    )

    BATCH = 200
    with path.open("w", encoding="utf-8", newline="\n") as f:
        f.write(header)
        for batch_start in range(0, len(rows), BATCH):
            batch = rows[batch_start : batch_start + BATCH]
            f.write(
                "INSERT INTO public.drawings "
                "(draw_date, n1, n2, n3, n4, n5, powerball, multiplier) VALUES\n"
            )
            value_lines = [
                "    ('{draw_date}', {n1:>2}, {n2:>2}, {n3:>2}, {n4:>2}, {n5:>2}, "
                "{powerball:>2}, {multiplier})".format(**r)
                for r in batch
            ]
            f.write(",\n".join(value_lines))
            f.write("\nON CONFLICT (draw_date) DO NOTHING;\n\n")

        f.write("SELECT public.refresh_number_stats();\n")

    return len(rows)


def write_csv(rows: Iterable[dict], path: Path) -> int:
    rows = list(rows)
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["draw_date", "n1", "n2", "n3", "n4", "n5", "powerball", "multiplier"]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    return len(rows)


def main() -> int:
    args = parse_args()
    input_path = resolve_input(args)
    if not input_path.exists():
        sys.exit(f"ERROR: input file not found: {input_path}")

    print(f"\nReading: {input_path}")
    rows = parse_csv(input_path)
    if not rows:
        sys.exit("ERROR: no valid rows parsed.")

    print(f"  parsed {len(rows)} valid drawings")
    print(f"  date range: {rows[0]['draw_date']} -> {rows[-1]['draw_date']}")

    sql_out = Path(args.sql).resolve()
    csv_out = Path(args.csv).resolve()

    n_sql = write_sql(rows, sql_out)
    print(f"\nWrote SQL: {sql_out}  ({n_sql} rows)")

    n_csv = write_csv(rows, csv_out)
    print(f"Wrote CSV: {csv_out}  ({n_csv} rows)")

    print("\nNext step:")
    print(f"  psql \"$DATABASE_URL\" -f {os.path.relpath(sql_out, Path.cwd())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
