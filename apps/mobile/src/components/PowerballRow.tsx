import { View } from "react-native";
import { PowerballNumber } from "./PowerballNumber";
import { COLORS } from "@millionmind/shared";

interface PowerballRowProps {
  whiteBalls: number[];
  powerball: number;
  size?: "sm" | "md" | "lg";
}

export function PowerballRow({ whiteBalls, powerball, size = "md" }: PowerballRowProps) {
  const gap = size === "lg" ? 12 : size === "md" ? 8 : 6;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap }}>
      {whiteBalls.map((n, i) => (
        <PowerballNumber key={`${n}-${i}`} value={n} variant="white" size={size} />
      ))}
      <View
        style={{
          width: 1,
          height: 24,
          backgroundColor: COLORS.rule,
          marginHorizontal: 4,
        }}
      />
      <PowerballNumber value={powerball} variant="powerball" size={size} />
    </View>
  );
}
