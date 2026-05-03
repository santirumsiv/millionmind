import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  ALGORITHMS,
  ALGORITHM_IDS,
  TIERS,
  type AlgorithmId,
  type GenerationResult,
  tierIncludesAlgorithm,
} from "@millionmind/shared";
import { generateNumbers, ApiCallError } from "@/lib/api";
import { useProfile, tierLabel } from "@/lib/queries";
import { PowerballNumber } from "@/components/PowerballNumber";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile } = useProfile();
  const tier = profile?.tier ?? "free";

  const [active, setActive] = useState<AlgorithmId>("random");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ballScales = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  function revealNumbers() {
    ballScales.forEach((scale, i) => {
      scale.value = 0;
      setTimeout(() => {
        scale.value = withSequence(
          withTiming(1.3, { duration: 180 }),
          withSpring(1, { damping: 8, stiffness: 120 }),
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }, i * 140);
    });
  }

  async function onGenerate() {
    setError(null);
    setPending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      const res = await generateNumbers(active);
      setResult(res);
      revealNumbers();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (e instanceof ApiCallError) {
        setError(e.detail.message);
      } else {
        setError("Generation failed. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
    >
      <View className="px-6">
        <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-2">
          § Generate
        </Text>
        <Text className="font-display text-[40px] leading-[1.05] text-ink mb-3">
          Pick an algorithm.
        </Text>
        <Text className="text-ink-soft text-[14px] leading-relaxed mb-8">
          Higher tiers unlock more sophisticated analytical methods. None change the odds of winning.
        </Text>

        <View className="gap-3 mb-8">
          {ALGORITHM_IDS.map((id) => {
            const algo = ALGORITHMS[id];
            const unlocked = tierIncludesAlgorithm(tier, id);
            const isActive = active === id;
            return (
              <Pressable
                key={id}
                onPress={() => unlocked && setActive(id)}
                disabled={!unlocked}
                className={`border p-4 ${
                  isActive
                    ? "border-gold bg-bg-panel"
                    : unlocked
                      ? "border-rule bg-bg-elevated"
                      : "border-rule-soft bg-bg-elevated opacity-50"
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-display text-[18px] text-ink">{algo.name}</Text>
                  {!unlocked ? (
                    <Text className="font-mono text-[9px] uppercase tracking-[2px] text-ink-faint">
                      Upgrade
                    </Text>
                  ) : null}
                </View>
                <Text className="text-ink-soft text-[13px] leading-relaxed">
                  {algo.shortDescription}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onGenerate}
          disabled={pending || !tierIncludesAlgorithm(tier, active)}
          className="bg-gold py-5 active:bg-gold-bright disabled:opacity-50"
        >
          {pending ? (
            <ActivityIndicator color="#0a0e0f" />
          ) : (
            <Text className="text-center font-mono text-[12px] tracking-[3px] uppercase text-bg font-semibold">
              Generate
            </Text>
          )}
        </Pressable>

        {error ? (
          <View className="mt-5 border border-warn bg-bg p-4">
            <Text className="text-warn text-[13px]">{error}</Text>
            {error.toLowerCase().includes("tier") ? (
              <Pressable onPress={() => router.push("/(tabs)/account")}>
                <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold mt-2">
                  Upgrade your tier →
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {result ? (
          <View className="mt-10 gap-5">
            <View className="flex-row justify-center flex-wrap gap-3 py-4">
              {result.white_balls.map((n, i) => {
                const animatedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: ballScales[i]!.value }],
                }));
                return (
                  <Animated.View key={`w-${i}`} style={animatedStyle}>
                    <PowerballNumber value={n} variant="white" size="lg" />
                  </Animated.View>
                );
              })}
              {(() => {
                const animatedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: ballScales[5]!.value }],
                }));
                return (
                  <Animated.View style={animatedStyle}>
                    <PowerballNumber value={result.powerball} variant="powerball" size="lg" />
                  </Animated.View>
                );
              })()}
            </View>
            <View className="items-center">
              <Text className="font-mono text-[10px] uppercase tracking-[2px] text-gold">
                {ALGORITHMS[result.algorithm].name}
              </Text>
              <Text className="font-mono text-[10px] tracking-[2px] text-ink-faint mt-1">
                {result.remaining_this_week === "unlimited"
                  ? "Unlimited remaining"
                  : `${result.remaining_this_week} remaining this week`}
              </Text>
            </View>
            <Text className="text-ink-faint text-[11px] leading-relaxed text-center pt-4 border-t border-rule">
              {result.disclaimer}
            </Text>
          </View>
        ) : null}

        <Text className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint text-center mt-10">
          Tier: {tierLabel(tier)} · Cap: {String(TIERS[tier].weeklyGenerationCap)}
        </Text>
      </View>
      <DisclaimerFooter />
    </ScrollView>
  );
}
