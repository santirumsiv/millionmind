#!/usr/bin/env node
/**
 * Pulls the latest drawings for every game we cover from official feeds
 * and rewrites apps/web/data/<game>.json. Used by the daily GitHub Action
 * AND runnable locally (`node scripts/refresh-drawings.mjs`) to refresh
 * before a manual deploy.
 *
 * Sources:
 *   Powerball     — NY State Open Data (https://data.ny.gov)
 *   Mega Millions — NY State Open Data (https://data.ny.gov)
 *
 * No DB. No auth. JSON files are the source of truth.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "apps", "web", "data");

const SOURCES = {
  powerball: {
    url: "https://data.ny.gov/resource/d6yy-54nr.json",
    parse: (rec) => parsePowerball(rec),
    whiteMax: 69,
    specialMax: 26,
  },
  megamillions: {
    url: "https://data.ny.gov/resource/5xaw-6ayf.json",
    parse: (rec) => parseMegaMillions(rec),
    whiteMax: 70,
    specialMax: 26,
  },
};

const PAGE_SIZE = 1000;

function parsePowerball(raw) {
  const dateStr = String(raw.draw_date ?? "").split("T")[0];
  if (!dateStr) return null;
  const nums = String(raw.winning_numbers ?? "").trim().split(/\s+/);
  if (nums.length !== 6) return null;
  const whites = nums.slice(0, 5).map(Number).sort((a, b) => a - b);
  const powerball = Number(nums[5]);
  if (whites.some((n) => !(n >= 1 && n <= 69))) return null;
  if (!(powerball >= 1 && powerball <= 26)) return null;
  if (new Set(whites).size !== 5) return null;
  const mult = Number(raw.multiplier ?? 1) || 1;
  return {
    draw_date: dateStr,
    n1: whites[0], n2: whites[1], n3: whites[2], n4: whites[3], n5: whites[4],
    powerball,
    multiplier: Math.max(1, Math.min(10, mult)),
  };
}

function parseMegaMillions(raw) {
  const dateStr = String(raw.draw_date ?? "").split("T")[0];
  if (!dateStr) return null;
  const nums = String(raw.winning_numbers ?? "").trim().split(/\s+/);
  if (nums.length !== 5) return null;
  const whites = nums.map(Number).sort((a, b) => a - b);
  const mega = Number(raw.mega_ball);
  if (whites.some((n) => !(n >= 1 && n <= 70))) return null;
  if (!(mega >= 1 && mega <= 26)) return null;
  if (new Set(whites).size !== 5) return null;
  const mult = Number(raw.multiplier ?? 1) || 1;
  return {
    draw_date: dateStr,
    n1: whites[0], n2: whites[1], n3: whites[2], n4: whites[3], n5: whites[4],
    powerball: mega, // schema reuses `powerball` for the special ball across games
    multiplier: Math.max(1, Math.min(10, mult)),
  };
}

async function fetchAll(url) {
  const all = [];
  let offset = 0;
  while (true) {
    const u = new URL(url);
    u.searchParams.set("$limit", String(PAGE_SIZE));
    u.searchParams.set("$offset", String(offset));
    u.searchParams.set("$order", "draw_date ASC");
    const res = await fetch(u);
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function refreshGame(game, cfg) {
  console.log(`[${game}] fetching from ${cfg.url} …`);
  const raw = await fetchAll(cfg.url);
  console.log(`[${game}] retrieved ${raw.length} raw records`);
  const parsed = raw.map(cfg.parse).filter(Boolean);
  parsed.sort((a, b) => a.draw_date.localeCompare(b.draw_date));
  const out = {
    game,
    generated_at: new Date().toISOString(),
    rows: parsed,
  };
  const file = path.join(DATA_DIR, `${game}.json`);
  await fs.writeFile(file, JSON.stringify(out, null, 2));
  console.log(`[${game}] wrote ${parsed.length} rows → ${file}`);
  return parsed.length;
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let total = 0;
  for (const [game, cfg] of Object.entries(SOURCES)) {
    total += await refreshGame(game, cfg);
  }
  console.log(`\nTotal across all games: ${total} drawings`);
}

main().catch((e) => {
  console.error("Refresh failed:", e);
  process.exit(1);
});
