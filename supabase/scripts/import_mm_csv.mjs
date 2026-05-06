// Million Mind — Mega Millions CSV Importer
// ==========================================
// Converts a Mega Millions CSV in the format
//
//     "Draw Date","Winning Numbers","Mega Ball","Multiplier"
//     "05/01/2026","16 21 27 41 61","24",
//
// into:
//
//   1. supabase/seed/mm_history.sql        (psql -f ready, with `game` column)
//   2. supabase/seed/mm_history.csv        (normalized for any tooling)
//   3. apps/web/public/mm_history.csv      (client-fetched by the demo)
//
// USAGE:
//   node supabase/scripts/import_mm_csv.mjs                                     # auto-finds ~/Downloads/megamillions.csv
//   node supabase/scripts/import_mm_csv.mjs path/to/megamillions.csv
//
// Schema rules applied:
//   - whites must be 1..70 (current Mega Millions max)
//   - mega ball must be 1..25 (covers 2017-2025 era; today is 1..24, also fits)
//   - rows from older formats (pre-Oct-2017) where whites > 70 or ball > 25 are dropped

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function parseArgs(argv) {
  const args = { input: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") args.input = argv[++i];
    else if (!a.startsWith("--") && !args.input) args.input = a;
  }
  return args;
}

function resolveInput(provided) {
  if (provided) return path.resolve(provided);
  const home = path.join(os.homedir(), "Downloads", "megamillions.csv");
  if (fs.existsSync(home)) return home;
  console.error(
    "ERROR: no input CSV found. Pass it as the first arg, --input, or place it at ~/Downloads/megamillions.csv.",
  );
  process.exit(1);
}

// CSV with quoted fields. The MM data uses simple quoting (no embedded quotes).
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseRow(raw, lineno) {
  if (raw.length < 3) {
    return null;
  }
  const dateStr = raw[0];
  const numbersStr = raw[1];
  const megaStr = raw[2];
  const multiplierStr = raw[3] ?? "";

  // MM/DD/YYYY -> YYYY-MM-DD
  const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!dateMatch) {
    if (lineno > 1) console.log(`  line ${lineno}: skipped — bad date "${dateStr}"`);
    return null;
  }
  const month = Number(dateMatch[1]);
  const day = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);

  const drawDate = new Date(Date.UTC(year, month - 1, day));
  if (
    drawDate.getUTCFullYear() !== year ||
    drawDate.getUTCMonth() !== month - 1 ||
    drawDate.getUTCDate() !== day
  ) {
    console.log(`  line ${lineno}: skipped — invalid date ${year}-${month}-${day}`);
    return null;
  }
  const drawDateIso = drawDate.toISOString().slice(0, 10);

  const whites = numbersStr
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
  if (whites.length !== 5 || whites.some((n) => !Number.isInteger(n))) {
    console.log(`  line ${lineno}: skipped — bad whites "${numbersStr}"`);
    return null;
  }
  whites.sort((a, b) => a - b);
  if (whites.some((n) => n < 1 || n > 70)) {
    console.log(`  line ${lineno}: skipped — white out of range ${JSON.stringify(whites)}`);
    return null;
  }
  if (new Set(whites).size !== 5) {
    console.log(`  line ${lineno}: skipped — duplicate whites ${JSON.stringify(whites)}`);
    return null;
  }

  const mega = Number(megaStr);
  if (!Number.isInteger(mega) || mega < 1 || mega > 25) {
    console.log(`  line ${lineno}: skipped — mega ball out of range ${megaStr}`);
    return null;
  }

  let multiplier = Number(multiplierStr);
  if (!Number.isFinite(multiplier) || multiplier < 1) multiplier = 1;
  multiplier = Math.max(1, Math.min(10, Math.trunc(multiplier)));

  return {
    draw_date: drawDateIso,
    n1: whites[0],
    n2: whites[1],
    n3: whites[2],
    n4: whites[3],
    n5: whites[4],
    powerball: mega, // we reuse the column name for both games
    multiplier,
  };
}

function parseCsv(filepath) {
  const text = fs.readFileSync(filepath, "utf-8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/);
  const seen = new Set();
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (i === 0 && line.toLowerCase().includes("draw date")) continue; // header
    const parsed = parseRow(parseCsvLine(line), i + 1);
    if (!parsed) continue;
    if (seen.has(parsed.draw_date)) continue;
    seen.add(parsed.draw_date);
    rows.push(parsed);
  }
  rows.sort((a, b) => a.draw_date.localeCompare(b.draw_date));
  return rows;
}

function pad(n, width) {
  return String(n).padStart(width, " ");
}

function writeSql(rows, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const lines = [];
  lines.push(
    "-- ─────────────────────────────────────────────────────────────────────",
    "-- Million Mind — Mega Millions Full History Seed (generated)",
    "-- ─────────────────────────────────────────────────────────────────────",
    "-- Run AFTER the migration that adds the `game` column:",
    "--   psql \"$DATABASE_URL\" -f supabase/seed/mm_history.sql",
    "-- Idempotent — ON CONFLICT (draw_date, game) DO NOTHING.",
    "-- ─────────────────────────────────────────────────────────────────────",
    "",
  );

  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    lines.push(
      "INSERT INTO public.drawings (game, draw_date, n1, n2, n3, n4, n5, powerball, multiplier) VALUES",
    );
    const valueLines = batch.map(
      (r) =>
        `    ('megamillions', '${r.draw_date}', ${pad(r.n1, 2)}, ${pad(r.n2, 2)}, ${pad(r.n3, 2)}, ${pad(r.n4, 2)}, ${pad(r.n5, 2)}, ${pad(r.powerball, 2)}, ${r.multiplier})`,
    );
    lines.push(valueLines.join(",\n"));
    lines.push("ON CONFLICT (draw_date, game) DO NOTHING;");
    lines.push("");
  }
  lines.push("SELECT public.refresh_number_stats();", "");

  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
}

function writeCsv(rows, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const header = "draw_date,n1,n2,n3,n4,n5,powerball,multiplier";
  const body = rows
    .map((r) =>
      [r.draw_date, r.n1, r.n2, r.n3, r.n4, r.n5, r.powerball, r.multiplier].join(","),
    )
    .join("\n");
  fs.writeFileSync(outPath, `${header}\n${body}\n`, "utf-8");
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const repoRoot = path.resolve(import.meta.dirname, "..", "..");
  const inputPath = resolveInput(args.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`ERROR: input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`\nReading: ${inputPath}`);
  const rows = parseCsv(inputPath);
  if (rows.length === 0) {
    console.error("ERROR: no valid rows parsed.");
    process.exit(1);
  }

  console.log(`  parsed ${rows.length} valid drawings`);
  console.log(`  date range: ${rows[0].draw_date} -> ${rows[rows.length - 1].draw_date}`);

  const sqlOut = path.join(repoRoot, "supabase", "seed", "mm_history.sql");
  const csvOutSeed = path.join(repoRoot, "supabase", "seed", "mm_history.csv");
  const csvOutPublic = path.join(repoRoot, "apps", "web", "public", "mm_history.csv");

  writeSql(rows, sqlOut);
  console.log(`\nWrote SQL:           ${sqlOut}  (${rows.length} rows)`);
  writeCsv(rows, csvOutSeed);
  console.log(`Wrote CSV (seed):    ${csvOutSeed}`);
  writeCsv(rows, csvOutPublic);
  console.log(`Wrote CSV (public):  ${csvOutPublic}`);

  console.log(`\nNext step (when DB is provisioned):`);
  console.log(`  psql "$DATABASE_URL" -f ${path.relative(process.cwd(), sqlOut).replace(/\\/g, "/")}`);
}

main();
