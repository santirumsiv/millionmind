import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Derive a stable per-day client identifier from request headers.
 *
 *   sha256(ip + user-agent + YYYY-MM-DD).slice(0, 16)
 *
 * Used as the rate-limit + ad-grant key. NOT a user identity — it's
 * scoped to the day so abuse is bounded and the hash isn't a long-lived
 * tracker. Bypassable by VPN, browser switching, or clearing cookies;
 * that's acceptable for a free-tier rate limit.
 */
export function deriveClientId(req: NextRequest): string {
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 16);
}
