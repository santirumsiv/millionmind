import { NextResponse, type NextRequest } from "next/server";
import { GAME_IDS, type GameId } from "@millionmind/shared";
import { statsForGame, topPairsForGame, totalDrawingsForGame } from "@/lib/algorithm-runner";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const game = (req.nextUrl.searchParams.get("game") ?? "powerball") as GameId;
  if (!GAME_IDS.includes(game)) {
    return NextResponse.json(
      { code: "BAD_GAME", message: `Unknown game: ${game}` },
      { status: 400 },
    );
  }
  const stats = statsForGame(game);
  const pairs = topPairsForGame(game, 25);
  const total = totalDrawingsForGame(game);
  return NextResponse.json({
    game,
    total_drawings: total,
    stats,
    top_pairs: pairs,
  });
}
