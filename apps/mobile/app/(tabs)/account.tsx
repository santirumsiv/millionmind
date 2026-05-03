import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TIERS,
  TIER_ORDER,
  RESPONSIBLE_GAMING_HOTLINE,
  RESPONSIBLE_GAMING_URL,
} from "@millionmind/shared";
import { useProfile, useUsageThisWeek, tierLabel } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth";
import { restorePurchases } from "@/lib/revenuecat";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: usage } = useUsageThisWeek();
  const signOut = useAuthStore((s) => s.signOut);

  async function onRestore() {
    try {
      await restorePurchases();
      await refetchProfile();
    } catch (e) {
      console.warn("Restore failed:", e);
    }
  }

  const tier = profile?.tier ?? "free";
  const cap = TIERS[tier].weeklyGenerationCap;
  const usedCount = usage?.count ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
    >
      <View className="px-6 gap-8">
        <View>
          <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-2">
            § Account
          </Text>
          <Text className="font-display text-[40px] leading-[1.05] text-ink">
            Your profile.
          </Text>
        </View>

        <View className="border border-rule bg-bg-elevated p-5">
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-2">
            Email
          </Text>
          <Text className="font-display text-[18px] text-ink mb-3">
            {profile?.email ?? "—"}
          </Text>
          <Text className="font-mono text-[10px] tracking-[2px] text-ink-faint">
            Member since{" "}
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
          </Text>
        </View>

        <View className="border border-rule bg-bg-elevated p-5">
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-2">
            Current tier
          </Text>
          <Text className="font-display text-[28px] text-ink leading-tight">
            {tierLabel(tier)}
          </Text>
          <Text className="font-mono text-[10px] tracking-[2px] text-ink-faint mt-2 mb-3">
            ${TIERS[tier].priceMonthlyUsd}/mo · {String(cap)} weekly{" "}
            {cap === "unlimited" ? "" : "generations"}
          </Text>
          <Text className="text-ink-soft text-sm">
            Used {usedCount} {cap === "unlimited" ? "" : `of ${cap}`} this week.
          </Text>
        </View>

        <View>
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-3">
            Upgrade
          </Text>
          <View className="gap-3">
            {TIER_ORDER.filter((id) => id !== "free" && id !== tier).map((id) => {
              const t = TIERS[id];
              return (
                <View key={id} className="border border-rule bg-bg-elevated p-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-display text-[18px] text-ink">{t.name}</Text>
                    <Text className="font-display text-[20px] text-gold-bright">
                      ${t.priceMonthlyUsd}
                    </Text>
                  </View>
                  <Text className="text-ink-soft text-[13px] leading-relaxed mb-3">
                    {t.features[0]}
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(app)/subscribe")}
                    className="border border-gold-deep py-3 active:border-gold"
                  >
                    <Text className="text-center font-mono text-[10px] uppercase tracking-[2px] text-gold">
                      Subscribe
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-3">
            Legal & support
          </Text>
          <View className="border border-rule bg-bg-elevated">
            <LegalRow label="Terms of Service" />
            <LegalRow label="Privacy Policy" />
            <LegalRow label="Responsible Gaming" />
            <Pressable
              className="px-5 py-4 flex-row items-center"
              onPress={() => Linking.openURL(`tel:${RESPONSIBLE_GAMING_HOTLINE.replace(/\D/g, "")}`)}
            >
              <Text className="text-ink-soft text-sm">
                Problem gambling?{" "}
                <Text className="text-gold">{RESPONSIBLE_GAMING_HOTLINE}</Text>
              </Text>
            </Pressable>
            <Pressable
              className="px-5 py-4"
              onPress={() => Linking.openURL(RESPONSIBLE_GAMING_URL)}
            >
              <Text className="text-ink-soft text-sm">
                <Text className="text-gold underline">ncpgambling.org</Text>
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={onRestore}
          className="border border-rule py-4 active:bg-bg-elevated"
        >
          <Text className="text-center font-mono text-[11px] uppercase tracking-[3px] text-ink-soft">
            Restore purchases
          </Text>
        </Pressable>

        <Pressable
          onPress={signOut}
          className="border border-warn py-4 active:bg-warn"
        >
          <Text className="text-center font-mono text-[11px] uppercase tracking-[3px] text-warn">
            Sign out
          </Text>
        </Pressable>
      </View>
      <DisclaimerFooter />
    </ScrollView>
  );
}

function LegalRow({ label }: { label: string }) {
  return (
    <Pressable className="px-5 py-4 border-b border-rule active:bg-bg-panel">
      <Text className="text-ink-soft text-sm">{label}</Text>
    </Pressable>
  );
}
