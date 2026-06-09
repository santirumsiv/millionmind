#!/usr/bin/env bash
#
# Start the three Canadian game backends for local development.
#
# Each game is a standalone Python service living in its own repo (outside this
# monorepo). The Next.js CA section (/ca) proxies to them via the adapter in
# apps/web/src/lib/ca-backends.ts. This script boots all three; run
# `npm run web` separately for the Next.js app.
#
# Override the project locations with env vars if your checkout differs:
#   LOTTO649_DIR  LOTTOMAX_DIR  DAILYGRAND_DIR
#
# Ports (must match CA_*_API_URL in .env.local):
#   Lotto 6/49  : 8000   (FastAPI)
#   Lotto Max   : 5050   (Flask)
#   Daily Grand : 5051   (Flask)
#
set -euo pipefail

LOTTO649_DIR="${LOTTO649_DIR:-$HOME/projects/649winner}"
LOTTOMAX_DIR="${LOTTOMAX_DIR:-$HOME/projects/lottomaxwin}"
DAILYGRAND_DIR="${DAILYGRAND_DIR:-$HOME/projects/dailygrand win}"

pids=()
cleanup() { echo; echo "Stopping CA backends…"; kill "${pids[@]}" 2>/dev/null || true; }
trap cleanup INT TERM EXIT

start() {
  local name="$1" dir="$2" py="$3" cmd="$4"
  if [[ ! -x "$dir/$py" ]]; then
    echo "⚠  $name: interpreter not found at $dir/$py — skipping. (See docs/CANADA.md for venv setup.)"
    return
  fi
  echo "▶ $name  ($dir)"
  ( cd "$dir" && "./$py" $cmd ) &
  pids+=($!)
}

echo "=== Million Mind — Canadian backends ==="
start "Lotto 6/49 :8000"  "$LOTTO649_DIR/backend"   "venv/bin/python"  "main.py"
start "Lotto Max  :5050"  "$LOTTOMAX_DIR/backend"   "venv/bin/python"  "app.py"
start "Daily Grand:5051"  "$DAILYGRAND_DIR/backend" ".venv/bin/python" "app.py"

echo
echo "All started. Health checks:"
echo "  curl localhost:8000/api/health   # 6/49"
echo "  curl localhost:5050/api/health   # Lotto Max"
echo "  curl localhost:5051/api/health   # Daily Grand"
echo
echo "Now run the web app:  npm run web   →  http://localhost:3000/ca"
echo "Press Ctrl-C to stop all backends."
wait
