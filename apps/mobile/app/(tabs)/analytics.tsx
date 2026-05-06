import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback, useMemo } from "react";
import { computeTopPairs } from "@millionmind/shared";
import { useNumberStats, useProfile, useRecentDrawings } from "@/lib/queries";
import { Heatmap } from "@/components/Heatmap";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const isPro = profile?.tier === "pro";

  const { data: stats, refetch: refetchStats, isLoading } = useNumberStats();
  const { data: drawings, refetch: refetchDrawings } = useRecentDrawings(isPro ? 500 : 30);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchDrawings()]);
    setRefreshing(false);
  }, [refetchStats, refetchDrawings]);

  const whites = (stats ?? [])
    .filter((s) => s.ball_type === "white")
    .sort((a, b) => b.frequency - a.frequency);
  const hotN = whites.slice(0, isPro ? 10 : 5);
  const coldN = whites.slice(isPro ? -10 : -5).reverse();

  const sumStats = computeSumStats(drawings ?? []);
  const topPairs = useMemo(
    () => (isPro && drawings ? computeTopPairs(drawings, 15) : []),
    [isPro, drawings],
  );

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
          {!isPro ? (
            <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint mt-3">
              🔒 Free · last 30 drawings, basic heatmap, top 5 hot/cold
            </Text>
          ) : null}
        </View>

        {/* White heatmap — always visible */}
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
          <Text className="font-display text-[22px] text-ink">
            Hot {isPro ? "10" : "5"}
          </Text>
          <View className="border border-rule bg-bg-elevated">
            {hotN.map((s, idx) => (
              <View
                key={s.number}
                className={`px-4 py-3 flex-row items-center justify-between ${
                  idx < hotN.length - 1 ? "border-b border-rule" : ""
                }`}
              >
                <Text className="font-display text-[16px] text-ink">#{s.number}</Text>
                <Text className="font-mono text-[12px] text-gold">{s.frequency} draws</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-display text-[22px] text-ink">
            Cold {isPro ? "10" : "5"}
          </Text>
          <View className="border border-rule bg-bg-elevated">
            {coldN.map((s, idx) => (
              <View
                key={s.number}
                className={`px-4 py-3 flex-row items-center justify-between ${
                  idx < coldN.length - 1 ? "border-b border-rule" : ""
                }`}
              >
                <Text className="font-display text-[16px] text-ink">#{s.number}</Text>
                <Text className="font-mono text-[12px] text-green">{s.frequency} draws</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Powerball heatmap — Pro only */}
        {isPro ? (
          <View className="gap-3">
            <View className="flex-row justify-between items-baseline">
              <Text className="font-display text-[22px] text-ink">Powerball</Text>
              <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint">
                1–26
              </Text>
            </View>
            <Heatmap stats={stats ?? []} ballType="powerball" count={26} cols={7} />
          </View>
        ) : (
          <View className="gap-3">
            <Text className="font-display text-[22px] text-ink">Powerball heatmap</Text>
            <UpgradePrompt
              feature="Powerball heatmap (1–26)"
              detail="Pro unlocks the special-ball heatmap with full hover details."
            />
          </View>
        )}

        {/* Sum stats — Pro only */}
        {isPro ? (
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
        ) : (
          <View className="gap-3">
            <Text className="font-display text-[22px] text-ink">Sum distribution</Text>
            <UpgradePrompt
              feature="Sum-distribution analytics"
              detail="See how the 5-ball sum clusters around the historical mean. Used by Pattern-Balanced and Monte Carlo to score combinations."
            />
          </View>
        )}

        {/* Pairs & Trends — Pro only */}
        {isPro ? (
          <View className="gap-3">
            <View className="flex-row justify-between items-baseline">
              <Text className="font-display text-[22px] text-ink">Pairs & trends</Text>
              <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint">
                Top 15 pairs
              </Text>
            </View>
            <Text className="text-ink-soft text-[13px] leading-relaxed">
              Numbers that have appeared together most often across the historical drawings.
            </Text>
            <View className="border border-rule bg-bg-elevated">
              {topPairs.map((pair, idx) => {
                const max = topPairs[0]?.count ?? 1;
                const pct = Math.round((pair.count / max) * 100);
                return (
                  <View
                    key={`${pair.a}-${pair.b}`}
                    className={`px-4 py-3 flex-row items-center justify-between ${
                      idx < topPairs.length - 1 ? "border-b border-rule" : ""
                    }`}
                  >
                    <Text className="font-mono text-[10px] text-ink-faint w-6">
                      {String(idx + 1).padStart(2, "0")}
                    </Text>
                    <View className="flex-row items-center gap-2 flex-1 ml-3">
                      <PairBall n={pair.a} />
                      <Text className="text-ink-faint">+</Text>
                      <PairBall n={pair.b} />
                    </View>
                    <View className="flex-1 mx-3 h-1 bg-rule-soft relative overflow-hidden">
                      <View
                        className="absolute inset-y-0 left-0 bg-gold/60"
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                    <Text className="font-mono text-[11px] text-gold w-16 text-right">
                      {pair.count}×
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="font-display text-[22px] text-ink">Pairs & trends</Text>
            <UpgradePrompt
              feature="Top co-occurring number pairs"
              detail="See which numbers have appeared together most often across the full historical dataset. Pro unlocks the top 15 pairs."
            />
          </View>
        )}

        <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint text-center">
          Powerball drawings are independent random events. Past frequencies do not predict future draws.
        </Text>
      </View>
      <DisclaimerFooter />
    </ScrollView>
  );
}

function PairBall({ n }: { n: number }) {
  return (
    <View className="w-8 h-8 rounded-full bg-bg-panel border border-rule items-center justify-center">
      <Text className="font-display text-[12px] text-ink">{n}</Text>
    </View>
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
