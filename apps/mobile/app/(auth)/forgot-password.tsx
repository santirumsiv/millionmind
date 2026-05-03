import { useState } from "react";
import {
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "millionmind://reset-password",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setInfo("Reset link sent. Check your email.");
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 64, paddingHorizontal: 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="font-mono text-[10px] uppercase tracking-[3px] text-gold mb-3">
        Reset password
      </Text>
      <Text className="font-display text-[40px] leading-[1.05] text-ink mb-6">
        We&apos;ll send a link.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#6b6960"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        className="border border-rule bg-bg-elevated text-ink px-4 py-4 mb-4"
      />

      {error ? <Text className="text-warn text-sm mb-3">{error}</Text> : null}
      {info ? <Text className="text-green text-sm mb-3">{info}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={loading || !email}
        className="bg-gold py-4 mb-6 active:bg-gold-bright disabled:opacity-50"
      >
        {loading ? (
          <ActivityIndicator color="#0a0e0f" />
        ) : (
          <Text className="text-center font-mono text-[11px] tracking-[3px] uppercase text-bg font-semibold">
            Send reset link
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
        <Text className="text-center font-mono text-[10px] tracking-[2px] uppercase text-gold">
          ← Back to sign in
        </Text>
      </Pressable>
    </ScrollView>
  );
}
