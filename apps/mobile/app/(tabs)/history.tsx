import { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GAMES,
  GAME_IDS,
  drawingsToCsv,
  todayStampedFilename,
} from "@millionmind/shared";
import { FREE_LIMITS, useProfile, useRecentDrawings } from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { shareCsv } from "@/lib/share-csv";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const isPro = profile?.tier === "pro";

  const [limit, setLimit] = useState(isPro ? 50 : FREE_LIMITS.drawingsHistory);
  const { data: drawings, isLoading, refetch } = useRecentDrawings(limit);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  async function onExport() {
    if (!drawings || !isPro) return;
    await shareCsv(drawingsToCsv(drawings), todayStampedFilename("powerball_drawings"));
  }

  const atFreeCap = !isPro && drawings && drawings.length >= FREE_LIMITS.drawingsHistory;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c9a66b" />}
    >
      <View className="px-6">
        <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-2">
          § History
        </Text>
        <Text className="font-display text-[40px] leading-[1.05] text-ink mb-3">
          Past drawings.
        </Text>
        <Text className="text-ink-soft text-[14px] leading-relaxed mb-4">
          {isPro
            ? "Every Powerball and Mega Millions drawing back to 2010, refreshed automatically every 4 hours."
            : `Free tier shows the last ${FREE_LIMITS.drawingsHistory} drawings. Pro unlocks the full archive.`}
        </Text>

        <View className="gap-2 mb-6">
          {GAME_IDS.map((id) => (
            <Pressable
              key={id}
              onPress={() => Linking.openURL(GAMES[id].officialResultsUrl)}
            >
              <Text className="font-mono text-[10px] uppercase tracking-[1.5px] text-ink-faint">
                Latest {GAMES[id].name} on official site ↗
              </Text>
            </Pressable>
          ))}
        </View>

        {isPro && drawings && drawings.length > 0 ? (
          <Pressable
            onPress={onExport}
            className="border border-gold-deep py-3 mb-6 active:border-gold"
          >
            <Text className="text-center font-mono text-[10px] uppercase tracking-[2px] text-gold">
              ↓ Export CSV ({drawings.length})
            </Text>
          </Pressable>
        ) : null}

        {isLoading && !drawings ? (
          <Text className="text-ink-faint text-sm">Loading drawings…</Text>
        ) : drawings?.length ? (
          <View className="border border-rule bg-bg-elevated">
            {drawings.map((d, idx) => (
              <View
                key={d.id}
                className={`p-4 ${idx < drawings.length - 1 ? "border-b border-rule" : ""}`}
              >
                <Text className="font-mono text-[11px] tracking-wide text-ink-soft mb-3">
                  {d.draw_date}  ·  {d.multiplier}× multiplier
                </Text>
                <PowerballRow
                  whiteBalls={[d.n1, d.n2, d.n3, d.n4, d.n5]}
                  powerball={d.powerball}
                  size="sm"
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="border border-rule bg-bg-elevated p-5">
            <Text className="text-ink-soft text-sm">
              No drawings loaded yet. Run the loader script (see supabase/README.md).
            </Text>
          </View>
        )}

        {atFreeCap ? (
          <View className="mt-6">
            <UpgradePrompt
              feature="See every drawing back to 2010"
              detail={`You've reached the Free-tier limit of ${FREE_LIMITS.drawingsHistory} most recent drawings.`}
            />
          </View>
        ) : drawings && drawings.length === limit ? (
          <Pressable
            onPress={() => setLimit((l) => l + 50)}
            className="border border-gold-deep py-3 mt-6 active:border-gold"
          >
            <Text className="text-center font-mono text-[10px] uppercase tracking-[2px] text-gold">
              Load more
            </Text>
          </Pressable>
        ) : null}
      </View>
      <DisclaimerFooter />
    </ScrollView>
  );
}
