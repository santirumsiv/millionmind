# Submission Checklist — Final gate before tapping "Submit for Review"

Walk through this with your attorney (per legal framework §11). Don't ship until every box is checked.

## Entity & ownership

- [ ] LLC or C-Corp formed with EIN, registered agent, business bank account
- [ ] Founder IP assignment to entity executed
- [ ] Business insurance bound (general liability + E&O / cyber)

## Legal documents — public URLs ready

- [ ] **Terms of Service** — replace placeholder at `/legal/terms` with attorney-reviewed version, hosted at https://millionmind.app/legal/terms
- [ ] **Privacy Policy** — CCPA/GDPR/state-law compliant, hosted at https://millionmind.app/legal/privacy
- [ ] **Refund Policy** — 7-day no-questions-asked, public
- [ ] **Responsible Gaming Statement** — already at `/legal/responsible-gaming`, verify the 1-800-GAMBLER link works
- [ ] **DPAs signed** with Supabase, RevenueCat, email provider

## Data load & backend

- [ ] Migration applied (`supabase db push`)
- [ ] `python supabase/scripts/doctor.py` returns all OK
- [ ] Production data loaded (`python supabase/scripts/load_powerball_history.py`) — `drawings` ≈ 1843 rows
- [ ] Edge functions deployed (`generate-numbers`, `revenuecat-webhook`, `refresh-stats`)
- [ ] `REVENUECAT_WEBHOOK_SECRET` and `REFRESH_STATS_SECRET` set as Supabase secrets
- [ ] pg_cron weekly refresh scheduled

## RevenueCat

- [ ] iOS API key set in EAS production env
- [ ] Android API key set in EAS production env
- [ ] Webhook URL configured in RC dashboard, pointing at `revenuecat-webhook` Edge Function
- [ ] All three products created in App Store Connect (`millionmind_*_monthly`)
- [ ] All three products created in Google Play Console
- [ ] Products mapped to entitlements (`starter_access` / `pro_access` / `elite_access`) in RC

## Mobile build

- [ ] Run `eas login` and `eas init` once
- [ ] Run `eas build --platform all --profile production`
- [ ] iOS sandbox purchase succeeds end-to-end
- [ ] Android License test purchase succeeds end-to-end
- [ ] Tier reflects in `profiles.tier` after purchase (RC webhook fired)
- [ ] Restore Purchases works on a fresh device
- [ ] Sign in with Apple works on iOS
- [ ] Google sign-in works on iOS and Android (with OAuth client IDs configured)

## Disclaimer & marketing audit

- [ ] **App Store description first paragraph** contains the verbatim disclaimer
- [ ] **Play Store full description first paragraph** contains the verbatim disclaimer
- [ ] In-app footer "For entertainment only…" appears on every screen
- [ ] No prediction-flavored language anywhere — search for: predict, winning numbers, boost odds, smart picks, lucky, guaranteed
- [ ] Tier descriptions framed as "deeper analysis" only, never "better odds"
- [ ] Non-affiliation disclaimer with MUSL in store listing first paragraph
- [ ] Marketing copy attorney-reviewed (4–8 hour pass)

## App Store specifics

- [ ] Category: **Entertainment** (not Lifestyle, not Finance)
- [ ] Age rating: **17+** ("Frequent/Intense Simulated Gambling")
- [ ] **Sign in with Apple** capability enabled — REQUIRED because Google sign-in is offered
- [ ] **Restore Purchases** button present (in `/account` screen)
- [ ] Privacy Nutrition Label completed accurately
- [ ] No external links to lottery ticket sales
- [ ] Demo account credentials provided to App Review

## Play Store specifics

- [ ] Category: Entertainment
- [ ] Content rating: PEGI 12 / ESRB Teen / IARC Mature
- [ ] Data safety form completed accurately
- [ ] Geo-blocks configured (Utah, Hawaii at minimum — verify with attorney)
- [ ] App Bundle (.aab) used, not legacy APK
- [ ] License test account configured

## Subscription compliance

- [ ] Pre-checkout disclosure screen with price, billing date, cancel instructions
- [ ] Auto-renewal consent as separate checkbox (not bundled with ToS)
- [ ] Confirmation email after every charge (RC default — verify enabled)
- [ ] One-tap cancellation in Account screen (no friction)
- [ ] 7-day refund window honored

## Privacy

- [ ] Data inventory documented (every field, purpose, retention)
- [ ] User rights workflow built (deletion, export, opt-out)
- [ ] Apple Privacy Nutrition Label filled accurately
- [ ] Google Data Safety form filled accurately
- [ ] Breach response plan documented (72-hour GDPR notification)

## Final commands

```bash
# 1. Build for production
cd apps/mobile
eas build --platform all --profile production

# 2. Submit (or use App Store Connect / Play Console UIs)
eas submit --platform ios --profile production
eas submit --platform android --profile production

# 3. Web — deploy via Vercel, Netlify, or your host of choice
cd ../web
npm run build
# Then push to your hosting provider
```

## Expected timing

- App Review: typically 24–48 hours
- Google Play review: typically 1–7 days (longer for first submission of lottery-adjacent apps)
- TestFlight beta: live immediately after build upload + processing (~1 hour)

Submit. Wait. Iterate.
