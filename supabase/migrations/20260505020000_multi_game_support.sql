-- ─────────────────────────────────────────────────────────────────────
-- Million Mind — Multi-game support (Powerball + Mega Millions)
-- ─────────────────────────────────────────────────────────────────────
-- One subscription tier covers all games. The schema adds a `game`
-- column to the relevant tables and loosens range CHECKs to fit the
-- union of the two games' matrices:
--
--   Powerball:     5/69 + 1/26
--   Mega Millions: 5/70 + 1/25 (1/24 today; 1/25 historical, 2017–2025)
--
-- Union: whites 1..70, special 1..26.
--
-- Tiers and weekly caps are NOT per-game — `usage_limits` stays as-is,
-- so the cap is the user's total weekly generation budget across both.
-- ─────────────────────────────────────────────────────────────────────

-- ─── drawings ────────────────────────────────────────────────────────
ALTER TABLE public.drawings
  ADD COLUMN IF NOT EXISTS game TEXT NOT NULL DEFAULT 'powerball'
    CHECK (game IN ('powerball', 'megamillions'));

-- The original UNIQUE(draw_date) is too strict — both games can draw
-- on the same calendar day. Replace with composite uniqueness.
ALTER TABLE public.drawings
  DROP CONSTRAINT IF EXISTS drawings_draw_date_key;

ALTER TABLE public.drawings
  ADD CONSTRAINT drawings_game_draw_date_key UNIQUE (game, draw_date);

-- Loosen white-ball CHECKs to BETWEEN 1 AND 70 (Mega Millions max).
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_n1_check;
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_n2_check;
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_n3_check;
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_n4_check;
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_n5_check;
ALTER TABLE public.drawings ADD CONSTRAINT drawings_n1_check CHECK (n1 BETWEEN 1 AND 70);
ALTER TABLE public.drawings ADD CONSTRAINT drawings_n2_check CHECK (n2 BETWEEN 1 AND 70);
ALTER TABLE public.drawings ADD CONSTRAINT drawings_n3_check CHECK (n3 BETWEEN 1 AND 70);
ALTER TABLE public.drawings ADD CONSTRAINT drawings_n4_check CHECK (n4 BETWEEN 1 AND 70);
ALTER TABLE public.drawings ADD CONSTRAINT drawings_n5_check CHECK (n5 BETWEEN 1 AND 70);

-- Game-specific range enforcement: a row's special must fit its game's max.
-- Powerball special goes 1..26; Mega Millions 1..25 (1..24 since Apr 2025).
ALTER TABLE public.drawings DROP CONSTRAINT IF EXISTS drawings_powerball_check;
ALTER TABLE public.drawings ADD CONSTRAINT drawings_special_per_game_check CHECK (
  (game = 'powerball'    AND powerball BETWEEN 1 AND 26) OR
  (game = 'megamillions' AND powerball BETWEEN 1 AND 25)
);

CREATE INDEX IF NOT EXISTS idx_drawings_game_date_desc
  ON public.drawings (game, draw_date DESC);

-- ─── number_stats ────────────────────────────────────────────────────
ALTER TABLE public.number_stats
  ADD COLUMN IF NOT EXISTS game TEXT NOT NULL DEFAULT 'powerball'
    CHECK (game IN ('powerball', 'megamillions'));

ALTER TABLE public.number_stats
  DROP CONSTRAINT IF EXISTS number_stats_unique;
ALTER TABLE public.number_stats
  ADD CONSTRAINT number_stats_unique UNIQUE (game, number, ball_type);

-- White / special CHECKs become game-aware.
ALTER TABLE public.number_stats DROP CONSTRAINT IF EXISTS number_stats_white_range;
ALTER TABLE public.number_stats DROP CONSTRAINT IF EXISTS number_stats_pb_range;
ALTER TABLE public.number_stats ADD CONSTRAINT number_stats_white_range CHECK (
  ball_type <> 'white' OR (
    (game = 'powerball'    AND number BETWEEN 1 AND 69) OR
    (game = 'megamillions' AND number BETWEEN 1 AND 70)
  )
);
ALTER TABLE public.number_stats ADD CONSTRAINT number_stats_special_range CHECK (
  ball_type <> 'powerball' OR (
    (game = 'powerball'    AND number BETWEEN 1 AND 26) OR
    (game = 'megamillions' AND number BETWEEN 1 AND 25)
  )
);

-- ─── generated_combinations ──────────────────────────────────────────
ALTER TABLE public.generated_combinations
  ADD COLUMN IF NOT EXISTS game TEXT NOT NULL DEFAULT 'powerball'
    CHECK (game IN ('powerball', 'megamillions'));

CREATE INDEX IF NOT EXISTS idx_gencombos_user_game_recent
  ON public.generated_combinations (user_id, game, created_at DESC);

-- ─── refresh_number_stats() ──────────────────────────────────────────
-- Recomputes per game. Replaces the original Powerball-only function.
CREATE OR REPLACE FUNCTION public.refresh_number_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- White balls — per game, all 5 positions
  INSERT INTO public.number_stats (game, number, ball_type, frequency, last_drawn, gap_days, updated_at)
  SELECT
    d.game,
    num                                      AS number,
    'white'                                  AS ball_type,
    COUNT(*)::INT                            AS frequency,
    MAX(d.draw_date)                         AS last_drawn,
    (CURRENT_DATE - MAX(d.draw_date))::INT   AS gap_days,
    NOW()                                    AS updated_at
  FROM public.drawings d,
    LATERAL (VALUES (d.n1), (d.n2), (d.n3), (d.n4), (d.n5)) AS t(num)
  GROUP BY d.game, num
  ON CONFLICT (game, number, ball_type) DO UPDATE SET
    frequency  = EXCLUDED.frequency,
    last_drawn = EXCLUDED.last_drawn,
    gap_days   = EXCLUDED.gap_days,
    updated_at = NOW();

  -- Special ball (powerball / mega ball) — per game
  INSERT INTO public.number_stats (game, number, ball_type, frequency, last_drawn, gap_days, updated_at)
  SELECT
    game,
    powerball                                AS number,
    'powerball'                              AS ball_type,
    COUNT(*)::INT                            AS frequency,
    MAX(draw_date)                           AS last_drawn,
    (CURRENT_DATE - MAX(draw_date))::INT     AS gap_days,
    NOW()                                    AS updated_at
  FROM public.drawings
  GROUP BY game, powerball
  ON CONFLICT (game, number, ball_type) DO UPDATE SET
    frequency  = EXCLUDED.frequency,
    last_drawn = EXCLUDED.last_drawn,
    gap_days   = EXCLUDED.gap_days,
    updated_at = NOW();
END;
$$;
