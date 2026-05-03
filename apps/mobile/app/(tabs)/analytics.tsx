import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useNumberStats, useRecentDrawings } from "@/lib/queries";
import { Heatmap } from "@/components/Heatmap";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { data: stats, refetch: refetchStats, isLoading } = useNumberStats();
  const { data: drawings, refetch: refetchDrawings } = useRecentDrawings(500);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchDrawings()]);
    setRefreshing(false);
  }, [refetchStats, refetchDrawings]);

  const whites = (stats ?? [])
    .filter((s) => s.ball_type === "white")
    .sort((a, b) => b.frequency - a.frequency);
  const hot10 = whites.slice(0, 10);
  const cold10 = whites.slice(-10).reverse();

  const sumStats = computeSumStats(drawings ?? []);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c9a66b" />}
    >
      <View className="px-6 gap-10">
        <View>
          <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-2">
            § Analytics
          </Text>
          <Text className="font-display text-[40px] leading-[1.05] text-ink mb-3">
            Frequency, gaps, patterns.
          </Text>
          <Text className="text-ink-soft text-[14px] leading-relaxed">
            Visualizations of historical Powerball data. The data is real; the future remains random.
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between items-baseline">
            <Text className="font-display text-[22px] text-ink">White ball heatmap</Text>
            <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint">
              1–69
            </Text>
          </View>
          {isLoading ? (
            <Text className="text-ink-faint text-sm">Loading…</Text>
          ) : (
            <Heatmap stats={stats ?? []} ballType="white" count={69} cols={10} />
          )}
        </View>

        <View className="gap-4">
          <Text className="font-display text-[22px] text-ink">Hot 10</Text>
          <View className="border border-rule bg-bg-elevated">
            {hot10.map((s, idx) => (
              <View
                key={s.number}
                className={`px-4 py-3 flex-row items-center justify-between ${
                  idx < hot10.length - 1 ? "border-b border-rule" : ""
                }`}
              >
                <Text className="font-display text-[16px] text-ink">#{s.number}</Text>
                <Text className="font-mono text-[12px] text-gold">{s.frequency} draws</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-display text-[22px] text-ink">Cold 10</Text>
          <View className="border border-rule bg-bg-elevated">
            {cold10.map((s, idx) => (
              <View
                key={s.number}
                className={`px-4 py-3 flex-row items-center justify-between ${
                  idx < cold10.length - 1 ? "border-b border-rule" : ""
                }`}
              >
                <Text className="font-display text-[16px] text-ink">#{s.number}</Text>
                <Text className="font-mono text-[12px] text-green">{s.frequency} draws</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between items-baseline">
            <Text className="font-display text-[22px] text-ink">Powerball</Text>
            <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint">
              1–26
            </Text>
          </View>
          <Heatmap stats={stats ?? []} ballType="powerball" count={26} cols={7} />
        </View>

        <View className="border border-rule bg-bg-elevated p-5">
          <Text className="font-display text-[20px] text-ink mb-2">Sum stats</Text>
          <Text className="text-ink-soft text-sm leading-relaxed mb-3">
            Across {drawings?.length ?? 0} recent drawings.
          </Text>
          <View className="gap-2">
            <SumRow label="Mean" value={sumStats.mean.toFixed(1)} />
            <SumRow label="Min" value={String(sumStats.min)} />
            <SumRow label="Max" value={String(sumStats.max)} />
            <SumRow label="In balanced range (100–220)" value={`${sumStats.inRangePct}%`} />
          </View>
        </View>

        <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint text-center">
          Powerball drawings are independent random events. Past frequencies do not predict future draws.
        </Text>
      </View>
      <DisclaimerFooter />
    </ScrollView>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-baseline">
      <Text className="text-ink-soft text-sm">{label}</Text>
      <Text className="font-mono text-[14px] text-gold-bright">{value}</Text>
    </View>
  );
}

function computeSumStats(
  drawings: Array<{ n1: number; n2: number; n3: number; n4: number; n5: number }>,
) {
  if (drawings.length === 0) return { mean: 0, min: 0, max: 0, inRangePct: 0 };
  const sums = drawings.map((d) => d.n1 + d.n2 + d.n3 + d.n4 + d.n5);
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const min = Math.min(...sums);
  const max = Math.max(...sums);
  const inRange = sums.filter((s) => s >= 100 && s <= 220).length;
  return {
    mean,
    min,
    max,
    inRangePct: Math.round((inRange / sums.length) * 100),
  };
}
