import { NextResponse, type NextRequest } from "next/server";
import { deriveClientId } from "@/lib/client-id";
import { getQuota } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = deriveClientId(req);
  const quota = await getQuota(clientId);
  return NextResponse.json(quota);
}
