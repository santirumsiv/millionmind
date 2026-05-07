import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { TIERS } from "@millionmind/shared";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type UpgradeSource = Extract<
  AnalyticsEvent,
  { name: "upgrade_cta_clicked" }
>["source"];

interface UpgradePromptProps {
  feature: string;
  detail?: string;
  /** Where in the app this prompt appears — fed into upgrade_cta_clicked. */
  source: UpgradeSource;
}

export function UpgradePrompt({ feature, detail, source }: UpgradePromptProps) {
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
        onPress={() => {
          track({ name: "upgrade_cta_clicked", source });
          router.push("/(app)/subscribe");
        }}
        className="bg-gold py-3 px-6 active:bg-gold-bright self-stretch"
      >
        <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
          Unlock Pro · ${TIERS.pro.priceMonthlyUsd.toFixed(2)}/mo
        </Text>
      </Pressable>
    </View>
  );
}
