-- ─────────────────────────────────────────────────────────────────────
-- Million Mind — Rewarded ad bonus accounting
-- ─────────────────────────────────────────────────────────────────────
-- Free users can earn up to 5 extra generations/week by watching
-- rewarded video ads. We track redemptions per ISO week so the cap is
-- enforced even across sessions / devices.
--
-- The ad SDK awards a reward client-side; the server is what makes it
-- count. Client posts to the `claim-rewarded-bonus` edge function which
-- runs `claim_rewarded_bonus_if_allowed()` atomically.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.usage_limits
  ADD COLUMN IF NOT EXISTS rewarded_bonus_count INT NOT NULL DEFAULT 0
    CHECK (rewarded_bonus_count >= 0);

-- Atomic claim function: increments rewarded_bonus_count if under cap,
-- and bumps the user's effective remaining quota by 1.
-- Returns the new bonus count if accepted, NULL if the cap is reached.
CREATE OR REPLACE FUNCTION public.claim_rewarded_bonus(
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
  INSERT INTO public.usage_limits (user_id, week_start, generations_count, rewarded_bonus_count)
  VALUES (p_user_id, p_week_start, 0, 1)
  ON CONFLICT (user_id, week_start) DO UPDATE
    SET rewarded_bonus_count = public.usage_limits.rewarded_bonus_count + 1
    WHERE public.usage_limits.rewarded_bonus_count < p_cap
  RETURNING rewarded_bonus_count INTO v_count;

  RETURN v_count;  -- NULL = cap reached
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_rewarded_bonus(UUID, DATE, INT) TO service_role;

-- Update the existing increment_usage_if_allowed function to allow
-- usage up to (cap + rewarded_bonus_count). This lets watched-ad
-- bonus generations actually unlock real generation requests.
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
  INSERT INTO public.usage_limits (user_id, week_start, generations_count, rewarded_bonus_count)
  VALUES (p_user_id, p_week_start, 1, 0)
  ON CONFLICT (user_id, week_start) DO UPDATE
    SET generations_count = public.usage_limits.generations_count + 1
    WHERE p_cap IS NULL
       OR public.usage_limits.generations_count <
          p_cap + public.usage_limits.rewarded_bonus_count
  RETURNING generations_count INTO v_count;

  RETURN v_count;  -- NULL = over (cap + bonus)
END;
$$;
