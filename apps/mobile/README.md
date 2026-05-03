# Million Mind — Mobile (Expo)

iOS + Android client. Single codebase via Expo Router + React Native.

## Run locally

```bash
# From repo root
npm install

# Mobile dev server
npm run mobile
# Or: cd apps/mobile && npx expo start

# Then either:
#   - Scan the QR with Expo Go (limited — Apple sign-in requires a dev build)
#   - Press i for iOS Simulator
#   - Press a for Android Emulator
```

## Environment

Mobile reads `EXPO_PUBLIC_*` variables. Set in `.env.local` at the repo root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=     # for Google sign-in
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

## Build & ship

See [`store-metadata/submission-checklist.md`](./store-metadata/submission-checklist.md) for the full pre-launch gate.

```bash
# From apps/mobile
eas login
eas init        # one-time, sets projectId in app.json
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android
```

Profiles in `eas.json`:
- **development** — dev client for local debugging on a real device
- **preview** — internal-distribution build for TestFlight / internal testers
- **production** — store-ready .ipa + .aab, auto-incrementing version codes

## Apple sign-in is required

Apple Review rejects iOS apps that offer any third-party sign-in (Google, etc.) without also offering Sign in with Apple. The button is in [`app/(auth)/sign-in.tsx`](app/(auth)/sign-in.tsx), and `usesAppleSignIn: true` is set in `app.json`.

## RevenueCat is the source of update; Supabase is the source of truth

Mobile calls RevenueCat to start a purchase. RevenueCat fires a webhook to the `revenuecat-webhook` Edge Function. That function updates `profiles.tier`. The mobile app re-reads the profile to refresh local tier state.

If you only update tier client-side, a savvy user can revert it. Always trust the server.

## Disclaimer

The disclaimer footer ([`src/components/DisclaimerFooter.tsx`](src/components/DisclaimerFooter.tsx)) appears on every scrollable screen. Don't remove it. App Store and FTC compliance depend on it.
