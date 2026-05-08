/**
 * Rate-limit + ad-grant store.
 *
 * Two-layer storage:
 *  - Vercel KV (Redis) when KV_REST_API_URL is set — production, persistent
 *  - In-memory Map when not — dev/local, ephemeral
 *
 * The in-memory impl is safe to rely on locally because there's no
 * cross-process consistency requirement during dev. In production the
 * KV impl shares state across all serverless instances.
 *
 * Free quota: sliding 5-minute window of generation timestamps.
 * Premium grants: separate counter, decremented on each premium use.
 * Grant rate-limit: max 5 ad-grants per hour per clientId.
 */

import { kv } from "@vercel/kv";

export const FREE_WINDOW_SEC = 300;       // 5 minutes
export const FREE_LIMIT = 5;              // generations per window
export const GRANT_PER_AD = 3;            // premium uses per ad watched
export const GRANT_HOURLY_CAP = 5;        // max ad-grants per hour
export const GRANT_WINDOW_SEC = 3600;     // 1 hour

export interface QuotaState {
  free_remaining: number;
  free_reset_in: number;       // seconds until oldest entry in window expires
  premium_uses: number;
  grants_used_this_hour: number;
  grants_remaining_this_hour: number;
}

const useKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ─── In-memory fallback (dev only) ──────────────────────────────────
const memFreeWindow = new Map<string, number[]>();   // clientId → timestamps (sec)
const memPremium = new Map<string, number>();        // clientId → premium uses left
const memGrants = new Map<string, number[]>();       // clientId → grant timestamps (sec)

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

async function freeWindowCount(clientId: string): Promise<{ count: number; oldest: number | null }> {
  const cutoff = nowSec() - FREE_WINDOW_SEC;
  if (useKv) {
    const key = `mm:free:${clientId}`;
    // Drop expired then count
    await kv.zremrangebyscore(key, 0, cutoff);
    const count = await kv.zcard(key);
    const oldestArr = await kv.zrange<string[]>(key, 0, 0, { withScores: true });
    const oldest = oldestArr.length >= 2 ? Number(oldestArr[1]) : null;
    return { count, oldest };
  }
  const arr = (memFreeWindow.get(clientId) ?? []).filter((t) => t > cutoff);
  memFreeWindow.set(clientId, arr);
  return { count: arr.length, oldest: arr[0] ?? null };
}

async function recordFreeGeneration(clientId: string): Promise<void> {
  const now = nowSec();
  if (useKv) {
    const key = `mm:free:${clientId}`;
    await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await kv.expire(key, FREE_WINDOW_SEC + 60);
    return;
  }
  const arr = memFreeWindow.get(clientId) ?? [];
  arr.push(now);
  memFreeWindow.set(clientId, arr);
}

async function getPremiumUses(clientId: string): Promise<number> {
  if (useKv) {
    const v = await kv.get<number>(`mm:prem:${clientId}`);
    return v ?? 0;
  }
  return memPremium.get(clientId) ?? 0;
}

async function setPremiumUses(clientId: string, value: number): Promise<void> {
  if (useKv) {
    if (value <= 0) await kv.del(`mm:prem:${clientId}`);
    else await kv.set(`mm:prem:${clientId}`, value, { ex: 86400 });
    return;
  }
  if (value <= 0) memPremium.delete(clientId);
  else memPremium.set(clientId, value);
}

async function grantsThisHour(clientId: string): Promise<number> {
  const cutoff = nowSec() - GRANT_WINDOW_SEC;
  if (useKv) {
    const key = `mm:grants:${clientId}`;
    await kv.zremrangebyscore(key, 0, cutoff);
    return await kv.zcard(key);
  }
  const arr = (memGrants.get(clientId) ?? []).filter((t) => t > cutoff);
  memGrants.set(clientId, arr);
  return arr.length;
}

async function recordGrant(clientId: string): Promise<void> {
  const now = nowSec();
  if (useKv) {
    const key = `mm:grants:${clientId}`;
    await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await kv.expire(key, GRANT_WINDOW_SEC + 60);
    return;
  }
  const arr = memGrants.get(clientId) ?? [];
  arr.push(now);
  memGrants.set(clientId, arr);
}

// ─── Public API ─────────────────────────────────────────────────────

export async function getQuota(clientId: string): Promise<QuotaState> {
  const { count, oldest } = await freeWindowCount(clientId);
  const premium = await getPremiumUses(clientId);
  const grantsUsed = await grantsThisHour(clientId);
  return {
    free_remaining: Math.max(0, FREE_LIMIT - count),
    free_reset_in: oldest === null ? 0 : Math.max(0, FREE_WINDOW_SEC - (nowSec() - oldest)),
    premium_uses: premium,
    grants_used_this_hour: grantsUsed,
    grants_remaining_this_hour: Math.max(0, GRANT_HOURLY_CAP - grantsUsed),
  };
}

export interface ConsumeResult {
  ok: boolean;
  reason?: "free_exhausted" | "premium_required";
  quota: QuotaState;
}

/**
 * Consume one generation. If `algorithm` is the random algorithm, deduct
 * from the free 5-min window. Otherwise deduct from the premium counter.
 * Returns ok=false with reason when the relevant bucket is empty.
 */
export async function consumeGeneration(
  clientId: string,
  isPremium: boolean,
): Promise<ConsumeResult> {
  if (isPremium) {
    const premium = await getPremiumUses(clientId);
    if (premium <= 0) {
      const q = await getQuota(clientId);
      return { ok: false, reason: "premium_required", quota: q };
    }
    await setPremiumUses(clientId, premium - 1);
    const q = await getQuota(clientId);
    return { ok: true, quota: q };
  }

  const { count } = await freeWindowCount(clientId);
  if (count >= FREE_LIMIT) {
    const q = await getQuota(clientId);
    return { ok: false, reason: "free_exhausted", quota: q };
  }
  await recordFreeGeneration(clientId);
  const q = await getQuota(clientId);
  return { ok: true, quota: q };
}

export interface AdGrantResult {
  ok: boolean;
  reason?: "grant_cap_reached";
  granted: number;
  quota: QuotaState;
}

/**
 * Record one ad-grant. Adds GRANT_PER_AD premium uses to the user's
 * counter, capped at GRANT_HOURLY_CAP grants per rolling hour.
 */
export async function grantAdReward(clientId: string): Promise<AdGrantResult> {
  const usedThisHour = await grantsThisHour(clientId);
  if (usedThisHour >= GRANT_HOURLY_CAP) {
    const q = await getQuota(clientId);
    return { ok: false, reason: "grant_cap_reached", granted: 0, quota: q };
  }
  const current = await getPremiumUses(clientId);
  await setPremiumUses(clientId, current + GRANT_PER_AD);
  await recordGrant(clientId);
  const q = await getQuota(clientId);
  return { ok: true, granted: GRANT_PER_AD, quota: q };
}
