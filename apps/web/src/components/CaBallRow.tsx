/**
 * Generalized ball row for Canadian games. Unlike the US PowerballRow (fixed
 * 5 whites + 1 special), this renders a variable-length main array and an
 * optional bonus ball — covering Lotto Max (7), 6/49 (6), and Daily Grand (5 + Grand).
 */

interface CaBallProps {
  value: number;
  variant?: "main" | "bonus";
  size?: "sm" | "md" | "lg";
}

export function CaBall({ value, variant = "main", size = "md" }: CaBallProps) {
  const sizeClasses = {
    sm: "w-9 h-9 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  }[size];

  const variantClasses =
    variant === "bonus"
      ? "bg-gold text-bg border-gold-deep"
      : "bg-bg-panel text-ink border-rule";

  return (
    <div
      className={`${sizeClasses} ${variantClasses} rounded-full border flex items-center justify-center font-display font-medium tracking-tight tabular-nums`}
      aria-label={`${variant === "bonus" ? "Bonus" : "Main"} ball ${value}`}
    >
      {value}
    </div>
  );
}

interface CaBallRowProps {
  main: number[];
  bonus?: number | null;
  bonusLabel?: string;
  size?: "sm" | "md" | "lg";
}

export function CaBallRow({ main, bonus, bonusLabel, size = "md" }: CaBallRowProps) {
  const gap = size === "lg" ? "gap-3" : size === "md" ? "gap-2" : "gap-1.5";
  return (
    <div className={`flex items-center flex-wrap ${gap}`}>
      {main.map((n, i) => (
        <CaBall key={`${n}-${i}`} value={n} variant="main" size={size} />
      ))}
      {bonus != null ? (
        <>
          <div className="flex flex-col items-center mx-1">
            <div className="w-px h-8 bg-rule" aria-hidden />
          </div>
          <div className="flex flex-col items-center gap-1">
            <CaBall value={bonus} variant="bonus" size={size} />
            {bonusLabel ? (
              <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink-faint">
                {bonusLabel}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
