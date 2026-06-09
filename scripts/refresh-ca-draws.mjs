#!/usr/bin/env node
/**
 * Keeps the Canadian draw-history JSON current — the CA counterpart of
 * scripts/refresh-drawings.mjs.
 *
 * The US games refresh off a clean public JSON API (NY State Open Data). The
 * OLG publishes no equivalent open API for Canadian games, so the deep history
 * is seeded once from the OLG "Since Inception" PDFs (scripts/parse-ca-draws.py)
 * and THIS script keeps it current by scraping the most-recent draws from WCLC
 * (Western Canada Lottery Corp), which publishes the official winning numbers
 * for all three games.
 *
 * It MERGES: existing rows (incl. the full PDF-seeded history) are kept, the
 * recent WCLC draws are added/updated, deduped by draw_date, re-sorted oldest
 * -first, and apps/web/data/ca-<game>.json is rewritten. Safe to run daily and
 * idempotent. If a game's fetch/parse fails, that game's file is left untouched.
 *
 * Run:  node scripts/refresh-ca-draws.mjs
 * Used by: .github/workflows/refresh-drawings.yml (same job as the US refresh)
 *
 * No DB. No auth. JSON files are the source of truth.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "apps", "web", "data");

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const SOURCES = {
  lotto649: {
    url: "https://www.wclc.com/winning-numbers/lotto-649-extra.htm",
    mainCount: 6,
    mainPool: 49,
    bonusSeparate: false,
    bonusMax: 49,
  },
  lottomax: {
    url: "https://www.wclc.com/winning-numbers/lotto-max-extra.htm",
    mainCount: 7,
    mainPool: 50,
    bonusSeparate: false,
    bonusMax: 50,
    // Lotto Max grew its pool 49→50 on 2019-05-14; earlier draws max out at 49.
    poolSwitch: { date: "2019-05-14", before: 49 },
  },
  dailygrand: {
    url: "https://www.wclc.com/winning-numbers/daily-grand-extra.htm",
    mainCount: 5,
    mainPool: 49,
    bonusSeparate: true, // Grand Number, own 1–7 pool
    bonusMax: 7,
  },
};

function toISODate(monthName, day, year) {
  const m = MONTHS[String(monthName).toLowerCase()];
  if (!m) return null;
  const d = Number(day);
  const y = Number(year);
  if (!(d >= 1 && d <= 31) || !(y >= 1980 && y <= 2100)) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Parse the recent draws out of a WCLC "…-extra.htm" page.
 * Each draw is a `pastWinNumDate` header (e.g. "Friday, May 29, 2026") followed
 * by the main-draw `<ul class="pastWinNumbers">`. Only `pastWinNumber` li's are
 * official main balls (MaxPlus / Bonus-Draw / Guaranteed-Prize side numbers use
 * other classes and are ignored). The bonus is `pastWinNumberBonus` (Max/649)
 * or `winNumHomeNumberBonusDG` (Daily Grand's Grand Number).
 */
function parseWclc(html, cfg) {
  const dateRe =
    /pastWinNumDate[\s\S]*?<h4>\s*(?:[A-Za-z]+,\s*)?([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\s*<\/h4>/g;
  const mainRe = /class="pastWinNumber"\s*>\s*(\d{1,2})\s*</g;
  const bonusRe =
    /class="(?:pastWinNumberBonus|winNumHomeNumberBonusDG)"[^>]*>[\s\S]*?<\/span>\s*(\d{1,2})/;

  // Index every date header, then slice the page between consecutive headers.
  const headers = [];
  let m;
  while ((m = dateRe.exec(html)) !== null) {
    const iso = toISODate(m[1], m[2], m[3]);
    if (iso) headers.push({ iso, at: m.index });
  }

  const rows = [];
  for (let i = 0; i < headers.length; i++) {
    const slice = html.slice(headers[i].at, headers[i + 1]?.at ?? html.length);

    const main = [];
    let mm;
    mainRe.lastIndex = 0;
    while ((mm = mainRe.exec(slice)) !== null && main.length < cfg.mainCount) {
      main.push(Number(mm[1]));
    }
    const bm = bonusRe.exec(slice);
    const bonus = bm ? Number(bm[1]) : NaN;

    const draw = { draw_date: headers[i].iso, main: [...main].sort((a, b) => a - b), bonus };
    if (validate(draw, cfg)) rows.push(draw);
  }
  return rows;
}

function validate(draw, cfg) {
  const { main, bonus, draw_date } = draw;
  if (main.length !== cfg.mainCount) return false;
  if (new Set(main).size !== cfg.mainCount) return false;
  let pool = cfg.mainPool;
  if (cfg.poolSwitch && draw_date < cfg.poolSwitch.date) pool = cfg.poolSwitch.before;
  if (main.some((n) => !(n >= 1 && n <= pool))) return false;
  if (cfg.bonusSeparate) {
    if (!(bonus >= 1 && bonus <= cfg.bonusMax)) return false;
  } else {
    if (!(bonus >= 1 && bonus <= pool) || main.includes(bonus)) return false;
  }
  return true;
}

async function refreshGame(game, cfg) {
  const file = path.join(DATA_DIR, `ca-${game}.json`);
  const existing = JSON.parse(await fs.readFile(file, "utf8"));

  console.log(`[${game}] fetching ${cfg.url} …`);
  const res = await fetch(cfg.url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${cfg.url} → HTTP ${res.status}`);
  const html = await res.text();

  const scraped = parseWclc(html, cfg);
  console.log(`[${game}] parsed ${scraped.length} recent draws from WCLC`);
  if (scraped.length === 0) throw new Error("no draws parsed — page layout may have changed");

  // Merge: keep all existing rows, let scraped draws add/override by date.
  const byDate = new Map(existing.rows.map((r) => [r.draw_date, r]));
  let added = 0;
  for (const d of scraped) {
    if (!byDate.has(d.draw_date)) added++;
    byDate.set(d.draw_date, d);
  }
  const rows = [...byDate.values()].sort((a, b) => a.draw_date.localeCompare(b.draw_date));

  const out = {
    game,
    generated_at: new Date().toISOString(),
    count: rows.length,
    date_range: rows.length
      ? { start: rows[0].draw_date, end: rows[rows.length - 1].draw_date }
      : null,
    rows,
  };
  await fs.writeFile(file, JSON.stringify(out, null, 0));
  console.log(
    `[${game}] +${added} new → ${rows.length} draws (through ${out.date_range?.end}) → ${file}`,
  );
  return added;
}

async function main() {
  let added = 0;
  let failures = 0;
  for (const [game, cfg] of Object.entries(SOURCES)) {
    try {
      added += await refreshGame(game, cfg);
    } catch (e) {
      failures++;
      console.error(`[${game}] refresh failed — keeping existing data: ${e.message}`);
    }
  }
  console.log(`\nAdded ${added} new Canadian drawings across all games.`);
  // Don't fail the whole job if one source hiccups, but do surface a total wipe-out.
  if (failures === Object.keys(SOURCES).length) {
    console.error("All Canadian sources failed.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("CA refresh failed:", e);
  process.exit(1);
});
