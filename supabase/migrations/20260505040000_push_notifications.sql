-- ─────────────────────────────────────────────────────────────────────
-- Million Mind — Push notification support
-- ─────────────────────────────────────────────────────────────────────
-- Stores Expo push tokens per user and a per-user opt-in flag for
-- drawing-night reminders.
--
-- Reminders fire ~30 minutes before each Powerball / Mega Millions
-- drawing for users with `notifications_enabled = true`. Pro-only
-- feature; the reminder Edge Function filters on tier.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_platform TEXT
    CHECK (push_platform IS NULL OR push_platform IN ('ios', 'android')),
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- For the cron-driven sender to find recipients efficiently.
CREATE INDEX IF NOT EXISTS idx_profiles_push_recipients
  ON public.profiles (notifications_enabled, tier)
  WHERE notifications_enabled = TRUE AND push_token IS NOT NULL;

-- Optional: log of sends so we can debug delivery and avoid duplicates.
CREATE TABLE IF NOT EXISTS public.notification_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  game          TEXT NOT NULL CHECK (game IN ('powerball', 'megamillions')),
  drawing_date  DATE NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expo_ticket   TEXT,
  status        TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error         TEXT,
  -- Prevents duplicate sends for the same user + game + drawing day.
  UNIQUE (user_id, game, drawing_date)
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_log_select_own"
  ON public.notification_log
  FOR SELECT
  USING (auth.uid() = user_id);
