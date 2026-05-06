// Million Mind — Auto-refresh drawings from official feeds
//
// Pulls the latest drawings for every game we know about and inserts
// any rows newer than what we already have. Game-aware: each entry in
// the GAMES registry declares its own data source + parsing format,
// so adding a new game only requires extending the registry — not
// touching this function.
//
// Auth: protected by REFRESH_DRAWINGS_SECRET. Set via:
//   supabase secrets set REFRESH_DRAWINGS_SECRET=$(openssl rand -hex 32)
//
// Schedule via Supabase pg_cron — recommended cadence: every 4 hours,
// since lottery sites publish results within hours of each draw.
//
// Run once in the SQL editor:
//   SELECT cron.schedule(
//     'refresh-drawings',
//     '15 */4 * * *',   -- 00:15, 04:15, 08:15, 12:15, 16:15, 20:15 UTC
//     $$ SELECT net.http_post(
//          url     := 'https://YOUR_PROJECT.functions.supabase.co/refresh-drawings',
//          headers := jsonb_build_object('Authorization', 'Bearer YOUR_REFRESH_SECRET')
//        ) $$
//   );
//
// Optional query param `?game=powerball` runs for just one game.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { GAMES, GAME_IDS, type GameDefinition, type GameId } from "../_shared/games.ts";

interface ParsedDrawing {
  game: GameId;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  powerball: number;
  multiplier: number;
}

interface RefreshResult {
  game: GameId;
  fetched: number;
  inserted: number;
  skipped: number;
  errors: number;
  latest: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getLatestDate(
  client: SupabaseClient,
  game: GameId,
): Promise<string | null> {
  const { data, error } = await client
    .from("drawings")
    .select("draw_date")
    .eq("game", game)
    .order("draw_date", { ascending: false })
    .limit(1);
  if (error) {
    console.error(`[${game}] latest-date lookup failed:`, error);
    return null;
  }
  return data?.[0]?.draw_date ?? null;
}

async function fetchSince(
  game: GameDefinition,
  sinceIso: string | null,
): Promise<unknown[]> {
  const params = new URLSearchParams();
  params.set("$order", `${game.apiSource.dateField} ASC`);
  params.set("$limit", "200");
  if (sinceIso) {
    params.set("$where", `${game.apiSource.dateField} > '${sinceIso}T00:00:00'`);
  } else {
    // First-ever load fallback — pull last 90 days.
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    params.set(
      "$where",
      `${game.apiSource.dateField} > '${ninetyDaysAgo}T00:00:00'`,
    );
  }

  const headers: Record<string, string> = {};
  const appToken = Deno.env.get("SOCRATA_APP_TOKEN");
  if (appToken) headers["X-App-Token"] = appToken;

  const url = `${game.apiSource.endpoint}?${params.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(
      `${game.id}: feed returned ${res.status}: ${await res.text()}`,
    );
  }
  return (await res.json()) as unknown[];
}

function clampMultiplier(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") return 1;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.max(1, Math.min(10, Math.trunc(n)));
}

function parseRecord(
  game: GameDefinition,
  raw: Record<string, unknown>,
): ParsedDrawing | null {
  const dateRaw = raw[game.apiSource.dateField];
  if (typeof dateRaw !== "string") return null;
  const drawDate = dateRaw.split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) return null;

  const numbersRaw = raw["winning_numbers"];
  if (typeof numbersRaw !== "string") return null;

  const tokens = numbersRaw.split(/\s+/).filter(Boolean).map(Number);

  let whites: number[];
  let special: number;

  if (game.apiSource.format === "powerball") {
    if (tokens.length !== 6) return null;
    whites = tokens.slice(0, 5);
    special = tokens[5]!;
  } else {
    // "split" — winning_numbers has only the 5 whites; special is its own column
    if (tokens.length !== 5) return null;
    whites = tokens;
    const specialRaw = raw[game.apiSource.specialField ?? "special"];
    if (specialRaw === null || specialRaw === undefined) return null;
    special = typeof specialRaw === "number" ? specialRaw : Number(specialRaw);
  }

  if (whites.some((n) => !Number.isInteger(n))) return null;
  whites.sort((a, b) => a - b);

  if (whites.some((n) => n < game.whiteMin || n > game.whiteMax)) return null;
  if (new Set(whites).size !== 5) return null;
  if (!Number.isInteger(special) || special < game.specialMin || special > game.specialMax) {
    return null;
  }

  const multiplier = clampMultiplier(
    raw[game.apiSource.multiplierField ?? "multiplier"],
  );

  return {
    game: game.id,
    draw_date: drawDate,
    n1: whites[0]!,
    n2: whites[1]!,
    n3: whites[2]!,
    n4: whites[3]!,
    n5: whites[4]!,
    powerball: special,
    multiplier,
  };
}

async function refreshGame(
  client: SupabaseClient,
  game: GameDefinition,
): Promise<RefreshResult> {
  const result: RefreshResult = {
    game: game.id,
    fetched: 0,
    inserted: 0,
    skipped: 0,
    errors: 0,
    latest: null,
  };

  try {
    const since = await getLatestDate(client, game.id);
    const raw = await fetchSince(game, since);
    result.fetched = raw.length;

    const parsed: ParsedDrawing[] = [];
    for (const r of raw) {
      const row = parseRecord(game, r as Record<string, unknown>);
      if (row) parsed.push(row);
      else result.errors += 1;
    }

    if (parsed.length === 0) {
      return result;
    }

    // The trigger on `drawings` will refresh number_stats automatically.
    const { error, count } = await client
      .from("drawings")
      .upsert(parsed, { onConflict: "game,draw_date", ignoreDuplicates: true, count: "exact" });
    if (error) {
      throw error;
    }
    result.inserted = count ?? parsed.length;
    result.skipped = parsed.length - result.inserted;
    result.latest = parsed[parsed.length - 1]!.draw_date;
  } catch (e) {
    console.error(`[${game.id}] refresh failed:`, e);
    result.errors += 1;
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  const expectedSecret = Deno.env.get("REFRESH_DRAWINGS_SECRET");
  if (!expectedSecret) {
    return jsonResponse({ error: "Refresh secret not configured" }, 500);
  }
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${expectedSecret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const gameParam = url.searchParams.get("game");
  const targetGames: GameId[] = gameParam
    ? GAME_IDS.includes(gameParam as GameId)
      ? [gameParam as GameId]
      : []
    : GAME_IDS;

  if (targetGames.length === 0) {
    return jsonResponse(
      { error: `Unknown game '${gameParam}'. Valid: ${GAME_IDS.join(", ")}` },
      400,
    );
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const results: RefreshResult[] = [];
  for (const id of targetGames) {
    results.push(await refreshGame(adminClient, GAMES[id]));
  }

  // Always refresh the cache — cheap, and catches any drift from
  // out-of-band inserts.
  await adminClient.rpc("refresh_number_stats");

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  return jsonResponse({
    ok: true,
    refreshed_at: new Date().toISOString(),
    total_inserted: totalInserted,
    games: results,
  });
});
