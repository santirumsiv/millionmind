"use client";

import { useState } from "react";
import type { NumberStats } from "@millionmind/shared";

interface HeatmapProps {
  stats: NumberStats[];
  ballType: "white" | "powerball";
  count: number;
  cols?: number;
}

export function Heatmap({ stats, ballType, count, cols }: HeatmapProps) {
  const [hovered, setHovered] = useState<NumberStats | null>(null);
  const filtered = stats
    .filter((s) => s.ball_type === ballType)
    .sort((a, b) => a.number - b.number);

  if (filtered.length === 0) {
    return (
      <div className="border border-rule bg-bg-elevated p-8 text-ink-soft text-sm">
        No statistics available yet. Load drawings first.
      </div>
    );
  }

  const max = Math.max(...filtered.map((s) => s.frequency), 1);
  const min = Math.min(...filtered.map((s) => s.frequency), 0);
  const cellsCols = cols ?? (ballType === "white" ? 10 : 7);

  return (
    <div className="space-y-4">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cellsCols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const stat = filtered.find((s) => s.number === n);
          const freq = stat?.frequency ?? 0;
          // Two-channel intensity: hue (gold→bright) + lightness step.
          // Color-blind friendly because both vary independently.
          const ratio = max === min ? 0 : (freq - min) / (max - min);
          const lightness = 12 + ratio * 32; // 12% → 44%
          const opacity = 0.35 + ratio * 0.65;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHovered(stat ?? null)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(stat ?? null)}
              onBlur={() => setHovered(null)}
              className="aspect-square flex items-center justify-center font-mono text-[11px] tabular-nums border border-rule-soft transition-transform hover:scale-105 focus:outline-gold"
              style={{
                backgroundColor: `hsl(38, 38%, ${lightness}%)`,
                color: ratio > 0.45 ? "#0a0e0f" : "#e8e4d8",
                opacity,
              }}
              aria-label={
                stat
                  ? `Number ${n}, drawn ${stat.frequency} times`
                  : `Number ${n}, no data`
              }
            >
              {n}
            </button>
          );
        })}
      </div>

      <div
        className="border border-rule bg-bg-panel p-4 min-h-[60px]"
        aria-live="polite"
      >
        {hovered ? (
          <p className="text-ink text-sm leading-relaxed">
            <span className="font-display text-lg text-gold-bright">
              Number {hovered.number}
            </span>
            {" — drawn "}
            <strong className="text-ink">{hovered.frequency}</strong> times
            {hovered.last_drawn ? (
              <>
                , last on{" "}
                <span className="font-mono text-[12px]">{hovered.last_drawn}</span>
                {hovered.gap_days != null
                  ? ` (${hovered.gap_days} day gap)`
                  : ""}
              </>
            ) : null}
            .
          </p>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
            Hover or focus a cell for details
          </p>
        )}
      </div>
    </div>
  );
}
