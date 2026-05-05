-- ─────────────────────────────────────────────────────────────────────
-- Million Mind — Add `mixed` and `anti_syndication` algorithms
-- ─────────────────────────────────────────────────────────────────────
-- Two new generation methods are surfaced in the app:
--   mixed             — combines hot + overdue + frequency-weighted picks
--   anti_syndication  — avoids birthday/sequential-style player patterns
--
-- This migration loosens the CHECK constraint on
-- generated_combinations.algorithm_used to accept the new identifiers.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.generated_combinations
  DROP CONSTRAINT IF EXISTS generated_combinations_algorithm_used_check;

ALTER TABLE public.generated_combinations
  ADD CONSTRAINT generated_combinations_algorithm_used_check
  CHECK (
    algorithm_used IN (
      'random',
      'hot',
      'cold',
      'gap',
      'pattern',
      'markov',
      'monte_carlo',
      'mixed',
      'anti_syndication'
    )
  );
