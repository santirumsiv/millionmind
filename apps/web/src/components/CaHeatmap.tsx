"use client";

import { useState } from "react";

/**
 * Frequency heatmap for a Canadian pool. Mirrors the US Heatmap visual but is
 * driven by a plain `number → count` map (the normalized CA stats shape) so it
 * works for any pool size — 1–50 (Lotto Max), 1–49 (6/49, Daily Grand main), or
 * 1–7 (Daily Grand Grand Number).
 */
interface CaHeatmapProps {
  frequency: Record<string, number>;
  count: number;
  cols?: number;
}

export function CaHeatmap({ frequency, count, cols = 10 }: CaHeatmapProps) {
  const [hovered, setHovered] = useState<{ n: number; freq: number } | null>(null);

  const freqs = Object.values(frequency);
  const hasData = freqs.length > 0 && freqs.some((f) => f > 0);

  if (!hasData) {
    return (
      <div className="border border-rule bg-bg-elevated p-8 text-ink-soft text-sm">
        No statistics available yet. Load draw data for this game first.
      </div>
    );
  }

  const max = Math.max(...freqs, 1);
  const min = Math.min(...freqs, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const freq = frequency[String(n)] ?? 0;
          const ratio = max === min ? 0 : (freq - min) / (max - min);
          const lightness = 12 + ratio * 32;
          const opacity = 0.35 + ratio * 0.65;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHovered({ n, freq })}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered({ n, freq })}
              onBlur={() => setHovered(null)}
              className="aspect-square flex items-center justify-center font-mono text-[11px] tabular-nums border border-rule-soft transition-transform hover:scale-105 focus:outline-gold"
              style={{
                backgroundColor: `hsl(38, 38%, ${lightness}%)`,
                color: ratio > 0.45 ? "#0a0e0f" : "#e8e4d8",
                opacity,
              }}
              aria-label={`Number ${n}, drawn ${freq} times`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="border border-rule bg-bg-panel p-4 min-h-[60px]" aria-live="polite">
        {hovered ? (
          <p className="text-ink text-sm leading-relaxed">
            <span className="font-display text-lg text-gold-bright">Number {hovered.n}</span>
            {" — drawn "}
            <strong className="text-ink">{hovered.freq}</strong> times across the loaded history.
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
