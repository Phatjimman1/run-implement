
-- Market comps from internal Tradera history
CREATE TABLE public.market_comps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_signature text NOT NULL,
  player text,
  brand text,
  set_name text,
  card_type text,
  is_rookie boolean NOT NULL DEFAULT false,
  is_auto boolean NOT NULL DEFAULT false,
  is_refractor boolean NOT NULL DEFAULT false,
  is_numbered boolean NOT NULL DEFAULT false,
  sale_price numeric NOT NULL,
  shipping_cost numeric,
  bid_count integer,
  source text NOT NULL DEFAULT 'tradera',
  source_listing_id uuid,
  sold_at timestamptz NOT NULL DEFAULT now(),
  raw_title text,
  UNIQUE (source, source_listing_id)
);

CREATE INDEX idx_market_comps_signature ON public.market_comps(card_signature, sold_at DESC);
CREATE INDEX idx_market_comps_player ON public.market_comps(player, sold_at DESC);

ALTER TABLE public.market_comps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_comps public read" ON public.market_comps FOR SELECT USING (true);

-- Player heat
CREATE TABLE public.player_heat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player text NOT NULL UNIQUE,
  heat_score integer NOT NULL DEFAULT 50,
  trend text NOT NULL DEFAULT 'STABLE', -- UP|STABLE|DOWN
  label text NOT NULL DEFAULT 'WARM',   -- HOT|WARM|COOL|COLD
  sample_size integer NOT NULL DEFAULT 0,
  recent_avg_price numeric,
  prior_avg_price numeric,
  active_listing_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_heat_score ON public.player_heat(heat_score DESC);

ALTER TABLE public.player_heat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_heat public read" ON public.player_heat FOR SELECT USING (true);

-- Extend analyses with market anchor + sniper + heat
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS card_signature text,
  ADD COLUMN IF NOT EXISTS comp_median numeric,
  ADD COLUMN IF NOT EXISTS comp_low numeric,
  ADD COLUMN IF NOT EXISTS comp_high numeric,
  ADD COLUMN IF NOT EXISTS comp_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comp_confidence text NOT NULL DEFAULT 'LOW', -- HIGH|MED|LOW
  ADD COLUMN IF NOT EXISTS discount_percent numeric,
  ADD COLUMN IF NOT EXISTS sniper_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'LOW',           -- LOW|MED|HIGH
  ADD COLUMN IF NOT EXISTS competition text NOT NULL DEFAULT 'MED',       -- LOW|MED|HIGH
  ADD COLUMN IF NOT EXISTS heat_score integer,
  ADD COLUMN IF NOT EXISTS heat_label text;                                -- HOT|WARM|COOL|COLD

CREATE INDEX IF NOT EXISTS idx_analyses_sniper ON public.analyses(sniper_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_signature ON public.analyses(card_signature);
