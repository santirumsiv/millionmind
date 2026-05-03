// OAuth provider helpers — Apple and Google.
//
// Apple sign-in is REQUIRED on iOS if you offer any third-party sign-in
// (per App Store Review Guideline 4.8). expo-apple-authentication wraps
// the native ASAuthorizationAppleIDButton.
//
// Google uses expo-auth-session with the Google OAuth web flow. For mobile,
// you'll create OAuth client IDs in Google Cloud Console and configure the
// redirect URI to match your scheme: millionmind://
//
// Both flows hand the resulting ID token to Supabase Auth's
// signInWithIdToken({ provider, token }) and let Supabase verify it.
//
// CONFIGURATION CHECKLIST (before either works in production):
//   1. Supabase dashboard → Authentication → Providers → enable Apple, Google
//   2. Apple Developer → Sign in with Apple service ID + key
//   3. Google Cloud Console → OAuth client IDs (iOS, Android, Web)
//   4. Add the OAuth-issued client IDs to supabase/config.toml
//   5. EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
//      in .env.local

import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export async function signInWithApple(): Promise<void> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple sign-in is only supported on iOS.");
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("No identity token returned from Apple.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
}

interface GoogleSignInOptions {
  iosClientId: string;
  webClientId: string;
}

/**
 * Google sign-in via expo-auth-session OAuth flow.
 * Returns void on success; throws on failure or user cancellation.
 */
export async function signInWithGoogle(options: GoogleSignInOptions): Promise<void> {
  const clientId =
    Platform.OS === "ios" ? options.iosClientId : options.webClientId;
  if (!clientId) {
    throw new Error(
      "Missing Google OAuth client ID. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "millionmind" });
  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "email", "profile"],
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { nonce: Math.random().toString(36).slice(2) },
  });
  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== "success") {
    throw new Error(`Google sign-in ${result.type}.`);
  }
  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error("No id_token returned from Google.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
}
