import { NextResponse, type NextRequest } from "next/server";
import { CA_GAME_IDS, type CaGameId } from "@millionmind/shared";
import { deriveClientId } from "@/lib/client-id";
import { consumeGeneration } from "@/lib/rate-limit";
import { caGenerateFromData } from "@/lib/ca-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateBody {
  mode?: string;
  count?: number;
}

export async function POST(
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

  let body: GenerateBody = {};
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    // empty body is fine — defaults apply
  }
  const mode = typeof body.mode === "string" ? body.mode : "balanced";
  const count = Number.isFinite(body.count) ? Number(body.count) : 5;

  // Reuse the same free/premium quota gate as the US generator.
  const clientId = deriveClientId(req);
  const consume = await consumeGeneration(clientId, false);
  if (!consume.ok) {
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message:
          "Free quota reached for the current 5-minute window. Wait a moment and try again.",
        quota: consume.quota,
      },
      { status: 429 },
    );
  }

  try {
    // Tickets are generated from the in-codebase draw history (apps/web/data/ca-*.json)
    // by the shared CA engine — no Python backend required.
    const result = caGenerateFromData(id, mode, count);
    return NextResponse.json({ ...result, quota: consume.quota });
  } catch {
    return NextResponse.json(
      { code: "INTERNAL", message: "Generation failed. Please try again." },
      { status: 500 },
    );
  }
}
