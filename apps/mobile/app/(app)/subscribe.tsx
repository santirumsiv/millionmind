import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { TIERS, TIER_ORDER, DISCLAIMER_SHORT } from "@millionmind/shared";
import {
  getOfferings,
  highestTierFromCustomerInfo,
  purchase,
  restorePurchases,
} from "@/lib/revenuecat";
import { useAuthStore } from "@/stores/auth";
import { track } from "@/lib/analytics";

export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const refreshTier = useAuthStore((s) => s.refreshTier);

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const o = await getOfferings();
      setOffering(o);
    } catch (e) {
      console.warn("Failed to load offerings:", e);
    } finally {
      setLoading(false);
    }
  }

  async function onPurchase(pkg: PurchasesPackage) {
    setPurchasing(pkg.identifier);
    try {
      const info = await purchase(pkg);
      const newTier = highestTierFromCustomerInfo(info);
      await refreshTier();
      // RevenueCat package identifiers follow the convention `<tier>_<period>`,
      // e.g. `pro_monthly` / `pro_annual`. Fall back to "monthly" if unclear.
      const variant: "monthly" | "annual" = pkg.identifier
        .toLowerCase()
        .includes("annual")
        ? "annual"
        : "monthly";
      track({ name: "subscription_started", variant });
      Alert.alert(
        "Welcome",
        `You are now on the ${TIERS[newTier].name} tier.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        Alert.alert("Purchase failed", err.message ?? "Please try again.");
      }
    } finally {
      setPurchasing(null);
    }
  }

  async function onRestore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (info) {
        const restored = highestTierFromCustomerInfo(info);
        await refreshTier();
        Alert.alert(
          restored === "free" ? "Nothing to restore" : "Restored",
          restored === "free"
            ? "We didn't find any prior purchases for this Apple ID / Google account."
            : `Restored to ${TIERS[restored].name} tier.`,
        );
      }
    } catch (e) {
      Alert.alert("Restore failed", (e as Error).message);
    } finally {
      setRestoring(false);
    }
  }

  // Map RevenueCat package identifiers to our TierIds via product ID.
  const packagesByTier = new Map<string, PurchasesPackage>();
  if (offering?.availablePackages) {
    for (const pkg of offering.availablePackages) {
      const productId = pkg.product.identifier;
      if (productId.includes("starter")) packagesByTier.set("starter", pkg);
      else if (productId.includes("pro")) packagesByTier.set("pro", pkg);
      else if (productId.includes("elite")) packagesByTier.set("elite", pkg);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
    >
      <View className="px-6 gap-8">
        <View>
          <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-2">
            ◆ Upgrade
          </Text>
          <Text className="font-display text-[40px] leading-[1.05] text-ink mb-3">
            Pick a tier.
          </Text>
          <Text className="text-ink-soft text-[14px] leading-relaxed">
            Higher tiers unlock more sophisticated analytical methods. None change the odds of winning.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#c9a66b" size="large" />
        ) : !offering ? (
          <View className="border border-warn bg-bg p-5">
            <Text className="text-warn text-sm mb-2">
              Subscription products are not configured yet.
            </Text>
            <Text className="text-ink-soft text-[12px] leading-relaxed">
              Set RevenueCat API keys in .env.local and create products in App Store Connect / Play Console.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {TIER_ORDER.filter((id) => id !== "free").map((id) => {
              const t = TIERS[id];
              const pkg = packagesByTier.get(id);
              return (
                <View key={id} className="border border-rule bg-bg-elevated p-5">
                  <View className="flex-row justify-between items-baseline mb-3">
                    <Text className="font-display text-[22px] text-ink">{t.name}</Text>
                    <Text className="font-display text-[26px] text-gold-bright">
                      {pkg?.product.priceString ?? `$${t.priceMonthlyUsd}`}
                      <Text className="font-mono text-[11px] text-ink-faint">/mo</Text>
                    </Text>
                  </View>
                  <View className="gap-1 mb-4">
                    {t.features.map((f) => (
                      <Text key={f} className="text-ink-soft text-[13px] leading-relaxed">
                        — {f}
                      </Text>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => pkg && onPurchase(pkg)}
                    disabled={!pkg || purchasing !== null}
                    className="bg-gold py-4 active:bg-gold-bright disabled:opacity-50"
                  >
                    {purchasing === pkg?.identifier ? (
                      <ActivityIndicator color="#0a0e0f" />
                    ) : (
                      <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
                        {pkg ? "Subscribe" : "Unavailable"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={onRestore}
          disabled={restoring}
          className="border border-gold-deep py-4 active:border-gold disabled:opacity-50"
        >
          {restoring ? (
            <ActivityIndicator color="#c9a66b" />
          ) : (
            <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-gold">
              Restore purchases
            </Text>
          )}
        </Pressable>

        <Text className="font-mono text-[10px] tracking-[2px] text-ink-faint text-center leading-relaxed">
          {DISCLAIMER_SHORT}
          {"\n\n"}
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Cancel any time in your Apple ID or Google Play subscription settings.
        </Text>
      </View>
    </ScrollView>
  );
}
