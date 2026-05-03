import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { TIERS } from "@millionmind/shared";
import {
  useMyCombinations,
  useProfile,
  useRecentDrawings,
  useUsageThisWeek,
  tierLabel,
} from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: usage, refetch: refetchUsage } = useUsageThisWeek();
  const { data: combos, refetch: refetchCombos } = useMyCombinations(3);
  const { data: drawings, refetch: refetchDrawings } = useRecentDrawings(1);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchUsage(), refetchCombos(), refetchDrawings()]);
    setRefreshing(false);
  }, [refetchProfile, refetchUsage, refetchCombos, refetchDrawings]);

  const tier = profile?.tier ?? "free";
  const cap = TIERS[tier].weeklyGenerationCap;
  const remaining =
    cap === "unlimited" ? "unlimited" : Math.max(0, cap - (usage?.count ?? 0));
  const lastDraw = drawings?.[0];
  const next = nextDrawingDate();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c9a66b" />}
    >
      <View className="px-6">
        <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-2">
          ◆ {tierLabel(tier)} tier
        </Text>
        <Text className="font-display text-[44px] leading-[1.05] text-ink mb-3">
          Welcome.
        </Text>
        <Text className="text-ink-soft text-[15px] leading-relaxed mb-8">
          {remaining === "unlimited"
            ? "Unlimited generations this week."
            : `${remaining} of ${cap} generations remaining this week.`}
        </Text>

        <Pressable
          onPress={() => router.push("/(tabs)/generate")}
          className="bg-gold py-5 mb-10 active:bg-gold-bright"
        >
          <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
            Generate Numbers
          </Text>
        </Pressable>

        <View className="gap-4 mb-10">
          <View className="border border-rule bg-bg-elevated p-5">
            <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-3">
              Next drawing
            </Text>
            <Text className="font-display text-[24px] text-ink leading-tight mb-1">
              {next.weekday}
            </Text>
            <Text className="font-mono text-[11px] text-ink-soft tracking-wide">
              {next.date} · 22:59 ET
            </Text>
          </View>

          <View className="border border-rule bg-bg-elevated p-5">
            <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-3">
              Last drawing
            </Text>
            {lastDraw ? (
              <>
                <Text className="font-mono text-[11px] text-ink-soft mb-3">
                  {lastDraw.draw_date}
                </Text>
                <PowerballRow
                  whiteBalls={[lastDraw.n1, lastDraw.n2, lastDraw.n3, lastDraw.n4, lastDraw.n5]}
                  powerball={lastDraw.powerball}
                  size="sm"
                />
              </>
            ) : (
              <Text className="text-ink-faint text-sm">Pull to refresh.</Text>
            )}
          </View>
        </View>

        <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mb-3">
          Recent generations
        </Text>
        {combos && combos.length > 0 ? (
          <View className="gap-3">
            {combos.map((c) => (
              <View key={c.id} className="border border-rule bg-bg-elevated p-4">
                <PowerballRow whiteBalls={c.white_balls} powerball={c.powerball} size="sm" />
                <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint mt-3">
                  {c.algorithm_used.replace("_", " ")} ·{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="border border-rule bg-bg-elevated p-5">
            <Text className="text-ink-soft text-sm">
              No combinations yet. Tap Generate to create your first.
            </Text>
          </View>
        )}
      </View>

      <DisclaimerFooter />
    </ScrollView>
  );
}

function nextDrawingDate(): { weekday: string; date: string } {
  const drawDays = [1, 3, 6];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    if (drawDays.includes(candidate.getDay())) {
      return {
        weekday: candidate.toLocaleDateString(undefined, { weekday: "long" }),
        date: candidate.toLocaleDateString(undefined, { month: "long", day: "numeric" }),
      };
    }
  }
  return { weekday: "—", date: "—" };
}
