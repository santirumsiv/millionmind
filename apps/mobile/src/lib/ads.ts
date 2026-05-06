// Million Mind — AdMob integration
//
// Free users see banner ads on the Generate tab and can opt into a
// rewarded video to unlock +1 generation (capped at 5/week server-side).
// Pro users never see ads — initialization is skipped via tier check.
//
// SETUP CHECKLIST:
//   1. Create AdMob accounts in Google AdMob (admob.google.com)
//   2. Create one app for iOS, one for Android. Get the App IDs.
//   3. Replace the placeholder IDs in app.json's
//      `react-native-google-mobile-ads` plugin config (androidAppId,
//      iosAppId).
//   4. Create three ad units: banner (Generate screen), rewarded video
//      (rewarded-bonus claim). Add their unit IDs to .env.local:
//        EXPO_PUBLIC_ADMOB_BANNER_ID_IOS=ca-app-pub-...
//        EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID=ca-app-pub-...
//        EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS=ca-app-pub-...
//        EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID=ca-app-pub-...
//   5. In AdMob dashboard → Blocking controls → Ad content,
//      block these advertiser categories: Gambling, Payday loans,
//      Online sweepstakes scams, Get-rich-quick schemes.
//
// Until step 3 is done, this code falls back to Google's TestIds —
// safe to ship in dev builds; never approve production with TestIds.

import { Platform } from "react-native";
import mobileAds, {
  TestIds,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from "react-native-google-mobile-ads";

let initialized = false;

export async function initAds(): Promise<void> {
  if (initialized) return;
  try {
    await mobileAds().initialize();
    initialized = true;
  } catch (e) {
    console.warn("[ads] Failed to initialize AdMob:", e);
  }
}

function pickEnv(iosKey: string, androidKey: string, fallback: string): string {
  const value =
    Platform.OS === "ios" ? process.env[iosKey] : process.env[androidKey];
  return value ?? fallback;
}

export const BANNER_AD_UNIT_ID = pickEnv(
  "EXPO_PUBLIC_ADMOB_BANNER_ID_IOS",
  "EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID",
  TestIds.BANNER,
);

const REWARDED_UNIT_ID = pickEnv(
  "EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS",
  "EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID",
  TestIds.REWARDED,
);

/**
 * Load and show a rewarded ad. Resolves with `true` if the user earned
 * the reward (watched to completion), `false` if they dismissed or the
 * ad failed to load.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    let earned = false;

    const subEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      },
    );
    const subClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      subEarned();
      subClosed();
      resolve(earned);
    });
    const subError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn("[ads] rewarded error:", err);
      subEarned();
      subClosed();
      subError();
      resolve(false);
    });
    const subLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      subLoaded();
      ad.show().catch((e) => {
        console.warn("[ads] rewarded show failed:", e);
        resolve(false);
      });
    });

    ad.load();
  });
}

/**
 * Tell the server to credit the reward. Called only after the rewarded
 * video completes. Returns the number of bonus uses left this week, or
 * null on failure / cap reached.
 */
export async function claimRewardedBonus(): Promise<{
  remainingBonusUses: number;
} | null> {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim-rewarded-bonus`;
  const { supabase } = await import("./supabase");
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    console.warn("[ads] claim-rewarded-bonus failed:", res.status);
    return null;
  }
  const json = (await res.json()) as { remaining_bonus_uses: number };
  return { remainingBonusUses: json.remaining_bonus_uses };
}
