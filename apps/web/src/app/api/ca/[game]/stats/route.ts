import { NextResponse, type NextRequest } from "next/server";
import { CA_GAME_IDS, type CaGameId } from "@millionmind/shared";
import { caStatsFromData } from "@/lib/ca-runner";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ game: string }> },
) {
  const { game } = await params;
  if (!CA_GAME_IDS.includes(game as CaGameId)) {
    return NextResponse.json(
      { code: "BAD_GAME", message: `Unknown Canadian game: ${game}` },
      { status: 400 },
    );
  }
  // Stats are computed from the in-codebase draw history (apps/web/data/ca-*.json),
  // not the Python backends — so this works with no services running.
  return NextResponse.json(caStatsFromData(game as CaGameId));
}
