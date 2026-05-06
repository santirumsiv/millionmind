import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { TIERS } from "@millionmind/shared";

interface UpgradePromptProps {
  feature: string;
  detail?: string;
}

export function UpgradePrompt({ feature, detail }: UpgradePromptProps) {
  const router = useRouter();
  return (
    <View className="border border-gold-deep bg-bg-elevated/60 p-6 items-center gap-3">
      <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold">
        🔒 Pro feature
      </Text>
      <Text className="font-display text-[20px] text-ink leading-tight text-center">
        {feature}
      </Text>
      {detail ? (
        <Text className="text-ink-soft text-[13px] leading-relaxed text-center">
          {detail}
        </Text>
      ) : null}
      <Pressable
        onPress={() => router.push("/(app)/subscribe")}
        className="bg-gold py-3 px-6 active:bg-gold-bright self-stretch"
      >
        <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
          Unlock Pro · ${TIERS.pro.priceMonthlyUsd.toFixed(2)}/mo
        </Text>
      </Pressable>
    </View>
  );
}
