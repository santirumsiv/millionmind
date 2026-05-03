interface PowerballNumberProps {
  value: number;
  variant?: "white" | "powerball";
  size?: "sm" | "md" | "lg";
}

export function PowerballNumber({
  value,
  variant = "white",
  size = "md",
}: PowerballNumberProps) {
  const sizeClasses = {
    sm: "w-9 h-9 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
  }[size];

  const variantClasses =
    variant === "powerball"
      ? "bg-gold text-bg border-gold-deep"
      : "bg-bg-panel text-ink border-rule";

  return (
    <div
      className={`${sizeClasses} ${variantClasses} rounded-full border flex items-center justify-center font-display font-medium tracking-tight tabular-nums`}
      aria-label={`${variant === "powerball" ? "Powerball" : "White ball"} ${value}`}
    >
      {value}
    </div>
  );
}
