import { useEffect, useState } from "react";
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
import { DISCLAIMER_SHORT } from "@millionmind/shared";
import { supabase } from "@/lib/supabase";
import { signInWithApple, signInWithGoogle } from "@/lib/auth-providers";
import { checkGeoEligibility, type GeoCheckResult } from "@/lib/geo";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoCheckResult | null>(null);

  useEffect(() => {
    void checkGeoEligibility().then(setGeo);
  }, []);

  const checking = geo === null;
  const blocked = geo?.blocked === true;

  async function onEmailSignUp() {
    if (blocked) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setInfo("Check your email for a confirmation link.");
    }
  }

  async function onApple() {
    if (blocked) return;
    try {
      await signInWithApple();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apple sign-in failed.");
    }
  }

  async function onGoogle() {
    if (blocked) return;
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
      <Text className="font-display text-[44px] leading-[1.05] text-ink mb-3">
        Start free.
      </Text>
      <Text className="text-ink-soft text-[15px] leading-relaxed mb-8">
        Free Explorer tier — 3 random combinations weekly. Upgrade any time.
      </Text>

      {blocked ? (
        <View className="border border-warn bg-bg-elevated p-5 mb-6">
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-warn mb-2">
            Region restricted
          </Text>
          <Text className="text-ink-soft text-[13px] leading-relaxed">
            {geo?.message ??
              "Million Mind is not currently available in your region."}
          </Text>
        </View>
      ) : null}

      <View className="gap-3 mb-5">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#6b6960"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!blocked && !checking}
          className="border border-rule bg-bg-elevated text-ink px-4 py-4"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#6b6960"
          secureTextEntry
          autoComplete="new-password"
          editable={!blocked && !checking}
          className="border border-rule bg-bg-elevated text-ink px-4 py-4"
        />
      </View>

      {error ? <Text className="text-warn text-sm mb-3">{error}</Text> : null}
      {info ? <Text className="text-green text-sm mb-3">{info}</Text> : null}

      <Pressable
        onPress={onEmailSignUp}
        disabled={loading || blocked || checking || !email || password.length < 8}
        className="bg-gold py-4 mb-3 active:bg-gold-bright disabled:opacity-50"
      >
        {loading ? (
          <ActivityIndicator color="#0a0e0f" />
        ) : (
          <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
            {checking ? "Checking availability…" : "Create account"}
          </Text>
        )}
      </Pressable>

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-rule" />
        <Text className="px-4 font-mono text-[10px] tracking-[2px] uppercase text-ink-faint">
          or
        </Text>
        <View className="flex-1 h-px bg-rule" />
      </View>

      {Platform.OS === "ios" && !blocked && !checking ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={0}
          style={{ width: "100%", height: 48, marginBottom: 12 }}
          onPress={onApple}
        />
      ) : null}

      <Pressable
        onPress={onGoogle}
        disabled={blocked || checking}
        className="border border-rule py-4 mb-6 active:bg-bg-elevated disabled:opacity-50"
      >
        <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-ink">
          Continue with Google
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
        <Text className="text-center text-ink-soft text-sm">
          Already have an account?{" "}
          <Text className="text-gold font-medium">Sign in</Text>
        </Text>
      </Pressable>

      <Text className="text-ink-faint text-[11px] leading-relaxed mt-8 text-center">
        {DISCLAIMER_SHORT}
      </Text>
    </ScrollView>
  );
}
