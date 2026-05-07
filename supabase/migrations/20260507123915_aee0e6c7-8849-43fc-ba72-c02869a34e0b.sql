
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS card_hierarchy_brand text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_tier text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_parallel text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_normalized_parallel text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_numbering text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_rank integer,
  ADD COLUMN IF NOT EXISTS card_hierarchy_score_bonus integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collector_priority text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_reasoning text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_warnings_json jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS card_hierarchy_brand text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_tier text,
  ADD COLUMN IF NOT EXISTS card_hierarchy_parallel text,
  ADD COLUMN IF NOT EXISTS collector_priority text;
