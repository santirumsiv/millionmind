/**
 * Client-side wrapper for the check-geo Edge Function.
 *
 * Used at signup to enforce US state-level restrictions (Utah, Hawaii)
 * — see section 9.4 of LAUNCH_PLAN.md. Fail-open: any error is treated
 * as "not blocked" so infrastructure problems don't block legitimate
 * signups. The legal posture is "documented good-faith effort," not
 * absolute enforcement.
 */

export interface GeoCheckResult {
  blocked: boolean;
  country: string | null;
  state: string | null;
  message: string | null;
}

export async function checkGeoEligibility(): Promise<GeoCheckResult> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-geo`;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  try {
    const res = await fetch(url, { headers: { apikey } });
    if (!res.ok) {
      return { blocked: false, country: null, state: null, message: null };
    }
    return (await res.json()) as GeoCheckResult;
  } catch {
    return { blocked: false, country: null, state: null, message: null };
  }
}
