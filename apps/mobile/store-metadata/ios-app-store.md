# iOS — App Store Connect Metadata

Copy these fields verbatim into App Store Connect. The disclaimer in the description's first paragraph is non-negotiable per legal framework §02 + §09.

## App information

| Field | Value |
|-------|-------|
| Name | Million Mind |
| Subtitle | Powerball stats & analytics |
| Bundle ID | com.millionmind.app |
| Primary Category | **Entertainment** |
| Secondary Category | (leave empty — do not pick Lifestyle or Finance) |
| Age Rating | **17+** ("Frequent/Intense Simulated Gambling") |
| Content Rights | I do not own or have licensed third-party content |

## Description

```
Million Mind is an entertainment and statistical analysis application. It does not predict, forecast, or otherwise indicate future Powerball drawings. Lottery drawings are independent random events; no algorithm, pattern, or analysis can improve the mathematical probability of winning, which remains 1 in 292,201,338 for the Powerball jackpot regardless of which numbers are selected.

Explore 1,800+ historical Powerball drawings since 2010 through frequency heatmaps, gap analysis, Markov chains, and Monte Carlo ensembles. Generate combinations from seven analytical methods, visualize patterns in past data, and track your picks over time.

FEATURES
— Frequency heatmap of every white ball (1–69) and Powerball (1–26)
— Hot 10 / Cold 10 dashboards with bar charts
— Sum distribution histogram
— Seven generation methods: Random, Hot, Cold, Gap, Pattern-Balanced, Markov Chain, Monte Carlo
— Personal pick history
— Calendar of every drawing since 2010

TIERS
— Explorer (Free): 3 random combinations weekly
— Analyst ($7.99/mo): 10 combinations, hot/cold dashboard, 1 year of history
— Strategist ($19.99/mo): 50 combinations, gap & pattern generators, full history, custom filters, CSV export
— Data Scientist ($39.99/mo): Unlimited combinations, Markov + Monte Carlo, full visualization suite, custom algorithm builder

Higher tiers unlock more sophisticated analytical features — they do not increase the user's chances of winning any lottery drawing.

Users must be 18 years of age or older to play Powerball. Please play responsibly. If you or someone you know has a gambling problem, call 1-800-GAMBLER or visit ncpgambling.org.

Million Mind is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery Association or any state lottery.
```

## Promotional text (170 char limit, can be updated without resubmit)

```
Powerball drawings analyzed across 1,800+ records. Heatmaps, gap analysis, Markov chains, Monte Carlo. For entertainment and analytical exploration only.
```

## Keywords (100 char limit, comma-separated)

```
powerball,lottery,statistics,analytics,frequency,heatmap,markov,monte carlo,patterns,history
```

## Support URL / Marketing URL

| Field | Value |
|-------|-------|
| Support URL | https://millionmind.app/support |
| Marketing URL | https://millionmind.app |
| Privacy Policy URL | https://millionmind.app/legal/privacy |

## Pricing

Free download. In-app subscriptions per RevenueCat:
- millionmind_starter_monthly — $7.99
- millionmind_pro_monthly — $19.99
- millionmind_elite_monthly — $39.99

## Sign in with Apple

Enable in Capabilities. **REQUIRED** because the app offers Google sign-in.

## Privacy nutrition label (Data linked to user)

| Data type | Used for | Linked to user |
|-----------|----------|----------------|
| Email address | App functionality, customer support | Yes |
| User ID (auth) | App functionality | Yes |
| Purchase history | App functionality, customer support | Yes |
| Other user content (generated combinations) | App functionality | Yes |

**Not collected:** advertising data, location, contacts, photos, browsing history, search history, audio data, gameplay content beyond combinations, sensitive info, health & fitness, financial info beyond purchases, or device IDs for tracking.

**Tracking:** No.

## Demo account for App Review

Provide one in App Store Connect → App Information → App Review Information:
- Email: review@millionmind.app
- Password: (rotate per submission, share via App Store Connect form only)
- Notes: Free tier by default. To test paid tiers, use the sandbox tester credentials in the same form.

## Screenshots

Submit 6 per device size (6.7", 6.5", 5.5"). The Analytics screen with the heatmap is the hero shot.

Recommended order:
1. Analytics — heatmap + hot/cold panels (the visual hook)
2. Generate — algorithm picker mid-reveal
3. Generate — finished combination with disclaimer
4. Home — tier badge + last/next drawing
5. History — calendar of past drawings
6. Account — tier card + responsible gaming
