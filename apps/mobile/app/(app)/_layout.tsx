import { Stack } from "expo-router";
import { COLORS } from "@millionmind/shared";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        presentation: "modal",
      }}
    />
  );
}
