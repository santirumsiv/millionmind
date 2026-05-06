-- ─────────────────────────────────────────────────────────────────────
-- Million Mind — Initial schema
-- ─────────────────────────────────────────────────────────────────────
-- Tables: drawings, profiles, generated_combinations, usage_limits, number_stats
-- Plus: RLS policies, refresh_number_stats() function, triggers
-- ─────────────────────────────────────────────────────────────────────

-- ─── Extensions ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. drawings ──────────────────────────────────────────────────────
-- Public read; populated via service-role only (loader scripts).
CREATE TABLE IF NOT EXISTS public.drawings (
  id           SERIAL PRIMARY KEY,
  draw_date    DATE NOT NULL UNIQUE,
  n1           INT NOT NULL CHECK (n1 BETWEEN 1 AND 69),
  n2           INT NOT NULL CHECK (n2 BETWEEN 1 AND 69),
  n3           INT NOT NULL CHECK (n3 BETWEEN 1 AND 69),
  n4           INT NOT NULL CHECK (n4 BETWEEN 1 AND 69),
  n5           INT NOT NULL CHECK (n5 BETWEEN 1 AND 69),
  powerball    INT NOT NULL CHECK (powerball BETWEEN 1 AND 26),
  multiplier   INT NOT NULL DEFAULT 1 CHECK (multiplier BETWEEN 1 AND 10),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawings_date_desc
  ON public.drawings (draw_date DESC);

ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drawings_public_read"
  ON public.drawings
  FOR SELECT
  USING (true);

-- No insert/update/delete policies = service role only.

-- ─── 2. profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email               TEXT,
  tier                TEXT NOT NULL DEFAULT 'free'
                        CHECK (tier IN ('free', 'starter', 'pro', 'elite')),
  revenuecat_user_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_user_id
  ON public.profiles (revenuecat_user_id)
  WHERE revenuecat_user_id IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup. Trigger runs as superuser so it can insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. generated_combinations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generated_combinations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  white_balls     INT[] NOT NULL CHECK (
                    array_length(white_balls, 1) = 5
                    AND white_balls[1] BETWEEN 1 AND 70
                    AND white_balls[2] BETWEEN 1 AND 70
                    AND white_balls[3] BETWEEN 1 AND 70
                    AND white_balls[4] BETWEEN 1 AND 70
                    AND white_balls[5] BETWEEN 1 AND 70
                  ),
  powerball       INT NOT NULL CHECK (powerball BETWEEN 1 AND 26),
  algorithm_used  TEXT NOT NULL CHECK (
                    algorithm_used IN
                      ('random','hot','cold','gap','pattern','markov','monte_carlo')
                  ),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gencombos_user_recent
  ON public.generated_combinations (user_id, created_at DESC);

ALTER TABLE public.generated_combinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gencombos_select_own"
  ON public.generated_combinations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts come from edge functions running with service role.

-- ─── 4. usage_limits ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_limits (
  user_id            UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  week_start         DATE NOT NULL,
  generations_count  INT NOT NULL DEFAULT 0 CHECK (generations_count >= 0),
  PRIMARY KEY (user_id, week_start)
);

ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_limits_select_own"
  ON public.usage_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Writes via service role from edge function only.

-- ─── 5. number_stats (cache) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.number_stats (
  id          SERIAL PRIMARY KEY,
  number      INT NOT NULL,
  ball_type   TEXT NOT NULL CHECK (ball_type IN ('white', 'powerball')),
  frequency   INT NOT NULL DEFAULT 0,
  last_drawn  DATE,
  gap_days    INT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT number_stats_unique UNIQUE (number, ball_type),
  CONSTRAINT number_stats_white_range
    CHECK (ball_type <> 'white' OR (number BETWEEN 1 AND 69)),
  CONSTRAINT number_stats_pb_range
    CHECK (ball_type <> 'powerball' OR (number BETWEEN 1 AND 26))
);

ALTER TABLE public.number_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "number_stats_public_read"
  ON public.number_stats
  FOR SELECT
  USING (true);

-- ─── refresh_number_stats() ───────────────────────────────────────────
-- Recomputes the cache from public.drawings. Called after bulk inserts and
-- by the AFTER INSERT trigger. Idempotent.
CREATE OR REPLACE FUNCTION public.refresh_number_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- White balls 1–69 across all 5 positions
  INSERT INTO public.number_stats (number, ball_type, frequency, last_drawn, gap_days, updated_at)
  SELECT
    num                                      AS number,
    'white'                                  AS ball_type,
    COUNT(*)::INT                            AS frequency,
    MAX(d.draw_date)                         AS last_drawn,
    (CURRENT_DATE - MAX(d.draw_date))::INT   AS gap_days,
    NOW()                                    AS updated_at
  FROM public.drawings d,
    LATERAL (VALUES (d.n1), (d.n2), (d.n3), (d.n4), (d.n5)) AS t(num)
  GROUP BY num
  ON CONFLICT (number, ball_type) DO UPDATE SET
    frequency  = EXCLUDED.frequency,
    last_drawn = EXCLUDED.last_drawn,
    gap_days   = EXCLUDED.gap_days,
    updated_at = NOW();

  -- Powerballs 1–26
  INSERT INTO public.number_stats (number, ball_type, frequency, last_drawn, gap_days, updated_at)
  SELECT
    powerball                                AS number,
    'powerball'                              AS ball_type,
    COUNT(*)::INT                            AS frequency,
    MAX(draw_date)                           AS last_drawn,
    (CURRENT_DATE - MAX(draw_date))::INT     AS gap_days,
    NOW()                                    AS updated_at
  FROM public.drawings
  GROUP BY powerball
  ON CONFLICT (number, ball_type) DO UPDATE SET
    frequency  = EXCLUDED.frequency,
    last_drawn = EXCLUDED.last_drawn,
    gap_days   = EXCLUDED.gap_days,
    updated_at = NOW();
END;
$$;

-- Refresh after any drawing insert. Statement-level so bulk inserts only fire once.
CREATE OR REPLACE FUNCTION public.trigger_refresh_number_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refresh_number_stats();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS drawings_refresh_stats ON public.drawings;
CREATE TRIGGER drawings_refresh_stats
  AFTER INSERT ON public.drawings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_number_stats();

-- ─── Atomic generation increment helper ──────────────────────────────
-- Used by generate-numbers edge function. Caller passes user_id, week_start, cap.
-- Returns the new count if accepted, NULL if rejected (over cap).
-- Pass cap = NULL for unlimited (elite tier).
CREATE OR REPLACE FUNCTION public.increment_usage_if_allowed(
  p_user_id     UUID,
  p_week_start  DATE,
  p_cap         INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.usage_limits (user_id, week_start, generations_count)
  VALUES (p_user_id, p_week_start, 1)
  ON CONFLICT (user_id, week_start) DO UPDATE
    SET generations_count = public.usage_limits.generations_count + 1
    WHERE p_cap IS NULL
       OR public.usage_limits.generations_count < p_cap
  RETURNING generations_count INTO v_count;

  RETURN v_count;  -- NULL means rejected (cap reached)
END;
$$;

-- ─── Grants ───────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.refresh_number_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_usage_if_allowed(UUID, DATE, INT) TO service_role;
