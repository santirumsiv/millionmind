-- ─────────────────────────────────────────────────────────────────────
-- Million Mind — Collapse 4 tiers to 2 (free + pro)
-- ─────────────────────────────────────────────────────────────────────
-- The four-tier ladder (free / starter / pro / elite at $0/$7.99/$19.99/$39.99)
-- is replaced with a two-tier model:
--
--   free  — random algorithm only, 10 generations/week (across both games),
--           ad-supported, basic analytics
--   pro   — all 9 algorithms, unlimited generations, full analytics, no ads.
--           Two billing variants in RevenueCat: pro_monthly $2.99 and
--           pro_annual $19.99. Both map to the `pro_access` entitlement
--           → tier='pro'.
--
-- Existing rows: any user previously on starter/pro/elite gets promoted
-- to the unified pro tier (they paid for something — keep them paid).
-- ─────────────────────────────────────────────────────────────────────

-- 1. Re-map any existing tier values BEFORE tightening the CHECK.
UPDATE public.profiles
SET tier = 'pro'
WHERE tier IN ('starter', 'elite');

-- 2. Drop the old constraint and reattach the tighter one.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'pro'));

-- 3. (Optional) Add a column to record which Pro billing variant the
-- user bought, for analytics. Doesn't gate access — `tier='pro'` does.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_billing_variant TEXT
    CHECK (pro_billing_variant IN ('monthly', 'annual'));
