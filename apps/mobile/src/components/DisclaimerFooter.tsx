import { View, Text } from "react-native";
import {
  DISCLAIMER_SHORT,
  RESPONSIBLE_GAMING_HOTLINE,
} from "@millionmind/shared";

export function DisclaimerFooter() {
  return (
    <View className="mt-16 pt-8 px-6 border-t border-rule items-center">
      <Text className="text-gold text-base mb-3">◆ ◆ ◆</Text>
      <Text className="font-mono text-[10px] tracking-[3px] text-ink-faint mb-2">
        MILLION MIND · v0.1
      </Text>
      <Text className="font-mono text-[10px] tracking-[2px] text-ink-faint text-center opacity-60 leading-relaxed mb-2">
        {DISCLAIMER_SHORT}
      </Text>
      <Text className="font-mono text-[10px] tracking-[2px] text-ink-faint text-center opacity-60">
        Problem gambling? Call {RESPONSIBLE_GAMING_HOTLINE}
      </Text>
    </View>
  );
}
