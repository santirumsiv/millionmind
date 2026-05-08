import { NextResponse, type NextRequest } from "next/server";
import { GAME_IDS, type GameId } from "@millionmind/shared";
import { recentDrawingsForGame, totalDrawingsForGame } from "@/lib/algorithm-runner";

export const runtime = "nodejs";

const HARD_LIMIT = 200;

export async function GET(req: NextRequest) {
  const game = (req.nextUrl.searchParams.get("game") ?? "powerball") as GameId;
  if (!GAME_IDS.includes(game)) {
    return NextResponse.json(
      { code: "BAD_GAME", message: `Unknown game: ${game}` },
      { status: 400 },
    );
  }
  const requested = Number(req.nextUrl.searchParams.get("limit") ?? "30");
  const limit = Math.min(HARD_LIMIT, Math.max(1, Number.isFinite(requested) ? requested : 30));
  const rows = recentDrawingsForGame(game, limit);
  return NextResponse.json({
    game,
    total_drawings: totalDrawingsForGame(game),
    rows,
  });
}
