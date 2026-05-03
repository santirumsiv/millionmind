import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { signInWithApple, signInWithGoogle } from "@/lib/auth-providers";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmailSignIn() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function onApple() {
    setError(null);
    try {
      await signInWithApple();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apple sign-in failed.");
    }
  }

  async function onGoogle() {
    setError(null);
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
    try {
      await signInWithGoogle({ iosClientId, webClientId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 64, paddingHorizontal: 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-3">
        ◆ Million Mind
      </Text>
      <Text className="font-display text-[44px] leading-[1.05] text-ink mb-8">
        Welcome back.
      </Text>

      <View className="gap-3 mb-5">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#6b6960"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          className="border border-rule bg-bg-elevated text-ink px-4 py-4"
          accessibilityLabel="Email address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#6b6960"
          secureTextEntry
          autoComplete="current-password"
          className="border border-rule bg-bg-elevated text-ink px-4 py-4"
          accessibilityLabel="Password"
        />
      </View>

      {error ? (
        <Text className="text-warn text-sm mb-3">{error}</Text>
      ) : null}

      <Pressable
        onPress={onEmailSignIn}
        disabled={loading || !email || !password}
        className="bg-gold py-4 mb-3 active:bg-gold-bright disabled:opacity-50"
      >
        {loading ? (
          <ActivityIndicator color="#0a0e0f" />
        ) : (
          <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
            Sign in
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/forgot-password" as never)}>
        <Text className="text-center font-mono text-[10px] tracking-[2px] uppercase text-ink-soft py-2">
          Forgot password?
        </Text>
      </Pressable>

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-rule" />
        <Text className="px-4 font-mono text-[10px] tracking-[2px] uppercase text-ink-faint">
          or continue with
        </Text>
        <View className="flex-1 h-px bg-rule" />
      </View>

      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={0}
          style={{ width: "100%", height: 48, marginBottom: 12 }}
          onPress={onApple}
        />
      ) : null}

      <Pressable
        onPress={onGoogle}
        className="border border-rule py-4 mb-6 active:bg-bg-elevated"
      >
        <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-ink">
          Continue with Google
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/(auth)/sign-up")}>
        <Text className="text-center text-ink-soft text-sm">
          New here?{" "}
          <Text className="text-gold font-medium">Create an account</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}
