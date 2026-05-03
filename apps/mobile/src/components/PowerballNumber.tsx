import { View, Text } from "react-native";

interface PowerballNumberProps {
  value: number;
  variant?: "white" | "powerball";
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { box: 36, font: 14 },
  md: { box: 48, font: 18 },
  lg: { box: 64, font: 22 },
};

export function PowerballNumber({
  value,
  variant = "white",
  size = "md",
}: PowerballNumberProps) {
  const { box, font } = SIZE_MAP[size];
  const isPowerball = variant === "powerball";
  return (
    <View
      className={
        isPowerball
          ? "bg-gold border-gold-deep border rounded-full items-center justify-center"
          : "bg-bg-panel border-rule border rounded-full items-center justify-center"
      }
      style={{ width: box, height: box }}
      accessibilityLabel={`${isPowerball ? "Powerball" : "White ball"} ${value}`}
    >
      <Text
        className={
          isPowerball
            ? "font-display text-bg font-semibold"
            : "font-display text-ink font-semibold"
        }
        style={{ fontSize: font }}
      >
        {value}
      </Text>
    </View>
  );
}
