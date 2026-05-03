import { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecentDrawings } from "@/lib/queries";
import { PowerballRow } from "@/components/PowerballRow";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [limit, setLimit] = useState(50);
  const { data: drawings, isLoading, refetch } = useRecentDrawings(limit);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
        <Text className="text-ink-soft text-[14px] leading-relaxed mb-8">
          Every Powerball drawing since 2010, from the New York State Open Data API.
        </Text>

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

        {drawings && drawings.length === limit ? (
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
