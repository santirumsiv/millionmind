import { NextResponse, type NextRequest } from "next/server";
import { CA_GAME_IDS, type CaGameId } from "@millionmind/shared";
import { recentCaDrawings, totalCaDrawings, caDateRange } from "@/lib/ca-history";

export const runtime = "nodejs";

const HARD_LIMIT = 200;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> },
) {
  const { game } = await params;
  if (!CA_GAME_IDS.includes(game as CaGameId)) {
    return NextResponse.json(
      { code: "BAD_GAME", message: `Unknown Canadian game: ${game}` },
      { status: 400 },
    );
  }
  const id = game as CaGameId;
  const requested = Number(req.nextUrl.searchParams.get("limit") ?? "30");
  const limit = Math.min(
    HARD_LIMIT,
    Math.max(1, Number.isFinite(requested) ? requested : 30),
  );
  return NextResponse.json({
    game: id,
    total_drawings: totalCaDrawings(id),
    date_range: caDateRange(id),
    rows: recentCaDrawings(id, limit),
  });
}
