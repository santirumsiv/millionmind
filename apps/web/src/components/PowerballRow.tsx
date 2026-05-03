import { PowerballNumber } from "./PowerballNumber";

interface PowerballRowProps {
  whiteBalls: number[];
  powerball: number;
  size?: "sm" | "md" | "lg";
}

export function PowerballRow({ whiteBalls, powerball, size = "md" }: PowerballRowProps) {
  const gap = size === "lg" ? "gap-3" : size === "md" ? "gap-2" : "gap-1.5";
  return (
    <div className={`flex items-center ${gap}`}>
      {whiteBalls.map((n, i) => (
        <PowerballNumber key={`${n}-${i}`} value={n} variant="white" size={size} />
      ))}
      <div className="w-px h-8 bg-rule mx-1" aria-hidden />
      <PowerballNumber value={powerball} variant="powerball" size={size} />
    </div>
  );
}
