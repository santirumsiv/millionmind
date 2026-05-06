// Million Mind — Drawing reminder sender
//
// Cron-driven Edge Function that finds users opted into drawing reminders
// and pushes them a notification ~30 minutes before each Powerball / Mega
// Millions draw.
//
// Schedule via Supabase pg_cron — recommended cadence is every 15 minutes.
// The function itself decides whether *now* is a reminder window for
// either game, so over-scheduling is harmless.
//
// Setup:
//   supabase secrets set REMINDER_FUNCTION_SECRET=$(openssl rand -hex 32)
//   supabase functions deploy send-drawing-reminders
//
//   -- in the SQL editor, run once:
//   SELECT cron.schedule(
//     'send-drawing-reminders',
//     '*/15 * * * *',
//     $$ SELECT net.http_post(
//          url     := 'https://YOUR_PROJECT.functions.supabase.co/send-drawing-reminders',
//          headers := jsonb_build_object('Authorization', 'Bearer YOUR_REMINDER_SECRET')
//        ) $$
//   );

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { GAMES, type GameId } from "../_shared/games.ts";

interface ProfileRow {
  id: string;
  push_token: string;
  push_platform: "ios" | "android" | null;
  tier: "free" | "pro";
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";
const REMINDER_LEAD_MINUTES = 30;
const SCHEDULE_TOLERANCE_MINUTES = 20; // Wider than cron interval (15m) so we don't miss a slot

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Returns the GameId of any game whose drawing is happening within
 * REMINDER_LEAD_MINUTES of now (in ET), or null if no reminder window.
 */
function gameInReminderWindow(now: Date): GameId | null {
  // Convert UTC `now` to America/New_York wall-clock components.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const weekdayPart = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const nowMin = hour * 60 + minute;

  // ISO weekday (1=Mon … 7=Sun)
  const isoWeekday =
    { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[weekdayPart] ?? 0;

  for (const id of Object.keys(GAMES) as GameId[]) {
    const g = GAMES[id];
    if (!g.drawWeekdays.includes(isoWeekday)) continue;
    const [drawH, drawM] = g.drawTimeEt.split(":").map(Number);
    const drawMin = drawH! * 60 + drawM!;
    const target = drawMin - REMINDER_LEAD_MINUTES;
    if (Math.abs(nowMin - target) <= SCHEDULE_TOLERANCE_MINUTES) {
      return id;
    }
  }
  return null;
}

function todayInEt(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // en-CA gives YYYY-MM-DD format
}

async function sendInBatches(messages: ExpoMessage[]): Promise<ExpoTicket[]> {
  const tickets: ExpoTicket[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      console.error(`Expo push API ${res.status}: ${await res.text()}`);
      continue;
    }
    const json = (await res.json()) as { data?: ExpoTicket[] };
    tickets.push(...(json.data ?? []));
  }
  return tickets;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();

  const expectedSecret = Deno.env.get("REMINDER_FUNCTION_SECRET");
  if (!expectedSecret) return jsonResponse({ error: "Secret not configured" }, 500);
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${expectedSecret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const now = new Date();
  const game = gameInReminderWindow(now);
  if (!game) {
    return jsonResponse({ ok: true, skipped: "no_reminder_window" });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Find Pro users with notifications enabled and a push token.
  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, push_token, push_platform, tier")
    .eq("notifications_enabled", true)
    .eq("tier", "pro")
    .not("push_token", "is", null);

  if (error) {
    console.error("Profile lookup failed:", error);
    return jsonResponse({ error: error.message }, 500);
  }

  const recipients = (profiles ?? []) as ProfileRow[];
  if (recipients.length === 0) {
    return jsonResponse({ ok: true, sent: 0, game });
  }

  // Filter out users we've already notified for this game today.
  const drawingDate = todayInEt(now);
  const { data: alreadySent } = await adminClient
    .from("notification_log")
    .select("user_id")
    .eq("game", game)
    .eq("drawing_date", drawingDate)
    .in("user_id", recipients.map((r) => r.id));

  const alreadyIds = new Set((alreadySent ?? []).map((r) => r.user_id));
  const fresh = recipients.filter((r) => !alreadyIds.has(r.id));

  if (fresh.length === 0) {
    return jsonResponse({ ok: true, sent: 0, game, reason: "all_already_notified" });
  }

  const gameDef = GAMES[game];
  const messages: ExpoMessage[] = fresh.map((r) => ({
    to: r.push_token,
    title: `${gameDef.name} drawing tonight`,
    body: `Drawing at ${gameDef.drawTimeEt} ET. Tap to see your saved combinations.`,
    sound: "default",
    data: { game, drawing_date: drawingDate },
  }));

  const tickets = await sendInBatches(messages);

  // Log the sends so we don't duplicate.
  const logRows = fresh.map((r, i) => ({
    user_id: r.id,
    game,
    drawing_date: drawingDate,
    expo_ticket: tickets[i]?.id ?? null,
    status: tickets[i]?.status === "ok" ? "sent" : "failed",
    error: tickets[i]?.message ?? tickets[i]?.details?.error ?? null,
  }));
  if (logRows.length > 0) {
    await adminClient.from("notification_log").insert(logRows);
  }

  const sent = tickets.filter((t) => t.status === "ok").length;
  return jsonResponse({
    ok: true,
    game,
    drawing_date: drawingDate,
    attempted: fresh.length,
    sent,
    failed: fresh.length - sent,
  });
});
