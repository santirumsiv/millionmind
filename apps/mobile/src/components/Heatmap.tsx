import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { NumberStats } from "@millionmind/shared";
import { COLORS } from "@millionmind/shared";

interface HeatmapProps {
  stats: NumberStats[];
  ballType: "white" | "powerball";
  count: number;
  cols?: number;
}

const CELL_GAP = 4;

export function Heatmap({ stats, ballType, count, cols }: HeatmapProps) {
  const [hovered, setHovered] = useState<NumberStats | null>(null);
  const filtered = stats
    .filter((s) => s.ball_type === ballType)
    .sort((a, b) => a.number - b.number);

  if (filtered.length === 0) {
    return (
      <View className="border border-rule bg-bg-elevated p-5">
        <Text className="text-ink-soft text-sm">
          No statistics yet. Load drawings first.
        </Text>
      </View>
    );
  }

  const max = Math.max(...filtered.map((s) => s.frequency), 1);
  const min = Math.min(...filtered.map((s) => s.frequency), 0);
  const cellsCols = cols ?? (ballType === "white" ? 10 : 7);

  const cells = Array.from({ length: count }, (_, i) => i + 1).map((n) => {
    const stat = filtered.find((s) => s.number === n);
    const freq = stat?.frequency ?? 0;
    const ratio = max === min ? 0 : (freq - min) / (max - min);
    const lightness = 12 + ratio * 32;
    return { n, stat, ratio, lightness };
  });

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap" style={{ gap: CELL_GAP }}>
        {cells.map(({ n, stat, ratio, lightness }) => (
          <Pressable
            key={n}
            onPressIn={() => setHovered(stat ?? null)}
            onPressOut={() => setHovered(null)}
            className="border border-rule-soft items-center justify-center"
            style={{
              backgroundColor: `hsl(38, 38%, ${lightness}%)`,
              width: `${100 / cellsCols - 2}%`,
              aspectRatio: 1,
            }}
          >
            <Text
              className="font-mono text-[10px]"
              style={{ color: ratio > 0.45 ? COLORS.bg : COLORS.ink }}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="border border-rule bg-bg-panel p-4 min-h-[60px]">
        {hovered ? (
          <Text className="text-ink text-sm leading-relaxed">
            <Text className="font-display text-base text-gold-bright">
              Number {hovered.number}
            </Text>
            {" — drawn "}
            <Text className="text-ink font-semibold">{hovered.frequency}</Text>
            {" times"}
            {hovered.last_drawn ? (
              <>
                {", last on "}
                <Text className="font-mono text-[12px]">{hovered.last_drawn}</Text>
                {hovered.gap_days != null ? ` (${hovered.gap_days} day gap)` : ""}
              </>
            ) : null}
            .
          </Text>
        ) : (
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint">
            Tap a cell for details
          </Text>
        )}
      </View>
    </View>
  );
}
