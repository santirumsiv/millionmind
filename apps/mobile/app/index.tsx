import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { COLORS } from "@millionmind/shared";

// AuthGate in _layout.tsx handles redirects after init. Until init completes,
// show a transient loader. Once initialized, route based on session presence.
export default function IndexRoute() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)/home" : "/(auth)/sign-in"} />;
}
