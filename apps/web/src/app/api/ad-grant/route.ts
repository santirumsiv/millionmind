import { NextResponse, type NextRequest } from "next/server";
import { deriveClientId } from "@/lib/client-id";
import { grantAdReward } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records that the client successfully watched a rewarded ad. Increments
 * their premium-use counter (server-authoritative; see /lib/rate-limit).
 *
 * Web doesn't have proper server-side ad-completion verification the way
 * mobile AdMob SSV does. We mitigate by capping grants at GRANT_HOURLY_CAP
 * per clientId per rolling hour. Combined with the IP+UA+day clientId,
 * a determined attacker can extract at most ~5 grants/hour = ~15 premium
 * uses/hour without rotating identity. Acceptable for a free-tier app.
 */
export async function POST(req: NextRequest) {
  const clientId = deriveClientId(req);
  const result = await grantAdReward(clientId);

  if (!result.ok) {
    return NextResponse.json(
      {
        code: "GRANT_CAP_REACHED",
        message: "You've reached the maximum number of ad-grants for this hour. Try again later.",
        quota: result.quota,
      },
      { status: 429 },
    );
  }

  return NextResponse.json({
    granted: result.granted,
    quota: result.quota,
  });
}
