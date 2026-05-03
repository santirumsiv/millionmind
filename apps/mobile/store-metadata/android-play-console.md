# Android — Google Play Console Metadata

## Store listing

| Field | Value |
|-------|-------|
| App name | Million Mind |
| Short description (80 char) | Powerball drawings analyzed — frequency, gap, Markov, Monte Carlo. Entertainment. |
| Full description | (see below) |
| App category | Entertainment |
| Tags | Statistics, Lottery, Analytics |

## Full description

```
Million Mind is an entertainment and statistical analysis application. It does not predict, forecast, or otherwise indicate future Powerball drawings. Lottery drawings are independent random events; no algorithm, pattern, or analysis can improve the mathematical probability of winning, which remains 1 in 292,201,338 for the Powerball jackpot regardless of which numbers are selected.

Explore 1,800+ historical Powerball drawings since 2010 through frequency heatmaps, gap analysis, Markov chains, and Monte Carlo ensembles. Generate combinations from seven analytical methods, visualize patterns in past data, and track your picks over time.

FEATURES
- Frequency heatmap of every white ball (1–69) and Powerball (1–26)
- Hot 10 / Cold 10 dashboards
- Sum distribution histogram
- Seven generation methods: Random, Hot, Cold, Gap, Pattern-Balanced, Markov Chain, Monte Carlo
- Personal pick history
- Calendar of every drawing since 2010

TIERS
- Explorer (Free): 3 random combinations weekly
- Analyst ($7.99/mo): 10 combinations, hot/cold dashboard, 1 year of history
- Strategist ($19.99/mo): 50 combinations, gap & pattern generators, full history, custom filters
- Data Scientist ($39.99/mo): Unlimited, Markov + Monte Carlo, full visualization suite

Higher tiers unlock more sophisticated analytical features — they do not increase the user's chances of winning any lottery drawing.

Users must be 18 years of age or older to play Powerball. Please play responsibly. If you or someone you know has a gambling problem, call 1-800-GAMBLER or visit ncpgambling.org.

Million Mind is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery Association or any state lottery.
```

## Content rating

Run the IARC questionnaire and answer:
- Does the app contain or reference gambling? **Yes — gambling-themed activities (no real-money wagering inside the app).**
- Does the app facilitate real-money gambling? **No.**

Expected ratings: **PEGI 12** / **ESRB Teen** / **IARC Mature 17+** depending on region.

## Data safety form

Data collected:
- Personal info: email address (required, linked to user, encrypted in transit, user can delete)
- Financial info: purchase history (required, linked, via Google Play Billing)
- App activity: in-app actions (generated combinations) — required, linked, user can delete

Data shared with third parties: **None.**

Security practices:
- Data is encrypted in transit
- Users can request data deletion (via Account screen and email)
- Data complies with the Families Policy: app is not directed at children

## Categorization

- App or game: **App**
- Category: **Entertainment**
- Target age: **Mature 17+** or older as appropriate for the region.
- Contains ads: **No**
- In-app purchases: **Yes** — $0.99–$39.99

## Permissions

None requested at runtime. Network is implicit.

## Geo-blocks

Restrict the app from these countries/territories at the Play Console level (one-time setup):
- United States — Utah
- United States — Hawaii
- (Add more per attorney guidance)

This complements the in-app geo-block at signup.

## App Bundle requirements

- Use Android App Bundle (.aab), not legacy APK
- Target API level: latest stable per Play Console requirement
- Min SDK: 24 (Android 7.0)

## Test user

For Google Play review:
- Email: review@millionmind.app
- Password: (rotate per submission)
- License test account: configure under Setup → License testing in Play Console
