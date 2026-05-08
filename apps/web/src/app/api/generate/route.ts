import { NextResponse, type NextRequest } from "next/server";
import {
  ALGORITHM_IDS,
  GAME_IDS,
  GEO_BLOCKED_US_STATES,
  type AlgorithmId,
  type GameId,
} from "@millionmind/shared";
import { deriveClientId } from "@/lib/client-id";
import { consumeGeneration } from "@/lib/rate-limit";
import { generateForGame } from "@/lib/algorithm-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_ALGORITHMS = new Set<AlgorithmId>([
  "hot",
  "cold",
  "gap",
  "pattern",
  "markov",
  "monte_carlo",
  "mixed",
  "anti_syndication",
]);

interface GenerateBody {
  algorithm: AlgorithmId;
  game: GameId;
}

function checkGeoBlock(req: NextRequest): { blocked: true; state: string } | { blocked: false } {
  const country = (
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    ""
  ).toUpperCase();
  const state = (
    req.headers.get("x-vercel-ip-country-region") ??
    req.headers.get("cf-region-code") ??
    ""
  ).toUpperCase();
  if (country !== "US" || !state) return { blocked: false };
  if ((GEO_BLOCKED_US_STATES as readonly string[]).includes(state)) {
    return { blocked: true, state };
  }
  return { blocked: false };
}

export async function POST(req: NextRequest) {
  const geo = checkGeoBlock(req);
  if (geo.blocked) {
    return NextResponse.json(
      {
        code: "REGION_BLOCKED",
        message: `Million Mind is not currently available to residents of ${geo.state}.`,
      },
      { status: 451 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ code: "BAD_BODY", message: "Invalid JSON body." }, { status: 400 });
  }

  if (!ALGORITHM_IDS.includes(body.algorithm)) {
    return NextResponse.json(
      { code: "BAD_ALGORITHM", message: `Unknown algorithm: ${body.algorithm}` },
      { status: 400 },
    );
  }
  if (!GAME_IDS.includes(body.game)) {
    return NextResponse.json(
      { code: "BAD_GAME", message: `Unknown game: ${body.game}` },
      { status: 400 },
    );
  }

  const clientId = deriveClientId(req);
  const isPremium = PREMIUM_ALGORITHMS.has(body.algorithm);

  const consume = await consumeGeneration(clientId, isPremium);
  if (!consume.ok) {
    if (consume.reason === "free_exhausted") {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Free quota reached for the current 5-minute window. Wait a moment or watch an ad to unlock premium algorithms.",
          quota: consume.quota,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        code: "PREMIUM_REQUIRED",
        message: "This algorithm requires a premium use. Watch a rewarded ad to unlock 3 uses.",
        quota: consume.quota,
      },
      { status: 402 },
    );
  }

  const combo = generateForGame(body.algorithm, body.game);

  return NextResponse.json({
    white_balls: combo.white_balls,
    powerball: combo.powerball,
    algorithm: body.algorithm,
    game: body.game,
    generated_at: new Date().toISOString(),
    quota: consume.quota,
    disclaimer:
      "For entertainment and analytical exploration only. Lottery drawings are independent random events; no algorithm changes the mathematical odds of winning.",
  });
}
