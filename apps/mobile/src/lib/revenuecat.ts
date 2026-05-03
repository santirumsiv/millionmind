// Million Mind — RevenueCat client wrapper
//
// Handles SDK init, log-in/log-out, fetching offerings, purchasing, and
// restoring. The server (revenuecat-webhook Edge Function) is the source
// of truth for the user's tier — the SDK call updates RevenueCat, the
// webhook then updates profiles.tier.
//
// SETUP CHECKLIST (one-time, in dashboards):
//   1. RevenueCat: create project → copy API keys for iOS + Android
//   2. App Store Connect: create products
//        millionmind_starter_monthly  $7.99
//        millionmind_pro_monthly      $19.99
//        millionmind_elite_monthly    $39.99
//   3. Google Play Console: create the same product IDs
//   4. RevenueCat dashboard: create entitlements
//        starter_access  →  starter_monthly
//        pro_access      →  pro_monthly
//        elite_access    →  elite_monthly
//   5. RevenueCat: configure webhook → https://<project>.functions.supabase.co/revenuecat-webhook
//      Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
//   6. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY in .env.local

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";
import type { TierId } from "@millionmind/shared";

let initialized = false;

export function initRevenueCat(): void {
  if (initialized) return;
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  const apiKey = Platform.OS === "ios" ? iosKey : androidKey;

  if (!apiKey) {
    console.warn(
      "[Million Mind] RevenueCat API key missing — subscriptions disabled. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY.",
    );
    return;
  }

  Purchases.configure({ apiKey });
  initialized = true;
}

export async function loginRevenueCat(userId: string): Promise<void> {
  if (!initialized) return;
  await Purchases.logIn(userId);
}

export async function logoutRevenueCat(): Promise<void> {
  if (!initialized) return;
  await Purchases.logOut();
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!initialized) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchase(pkg: PurchasesPackage): Promise<CustomerInfo> {
  if (!initialized) throw new Error("RevenueCat not initialized.");
  const result = await Purchases.purchasePackage(pkg);
  return result.customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  return Purchases.restorePurchases();
}

export function highestTierFromCustomerInfo(info: CustomerInfo): TierId {
  const active = info.entitlements.active ?? {};
  if (active["elite_access"]) return "elite";
  if (active["pro_access"]) return "pro";
  if (active["starter_access"]) return "starter";
  return "free";
}
