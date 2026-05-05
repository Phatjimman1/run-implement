
-- search_terms
CREATE TABLE public.search_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 1,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.search_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_terms public read" ON public.search_terms FOR SELECT USING (true);

-- listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradera_item_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  current_price NUMERIC,
  buy_now_price NUMERIC,
  shipping_cost NUMERIC,
  end_time TIMESTAMPTZ,
  seller_name TEXT,
  seller_rating NUMERIC,
  bid_count INT,
  raw_json JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings public read" ON public.listings FOR SELECT USING (true);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_end_time ON public.listings(end_time);
CREATE INDEX idx_listings_last_seen ON public.listings(last_seen_at DESC);

-- analyses
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL UNIQUE REFERENCES public.listings(id) ON DELETE CASCADE,
  detected_players TEXT[] NOT NULL DEFAULT '{}',
  detected_brands TEXT[] NOT NULL DEFAULT '{}',
  detected_sets TEXT[] NOT NULL DEFAULT '{}',
  detected_card_types TEXT[] NOT NULL DEFAULT '{}',
  is_rookie BOOLEAN NOT NULL DEFAULT false,
  is_auto BOOLEAN NOT NULL DEFAULT false,
  is_certified_auto BOOLEAN NOT NULL DEFAULT false,
  is_refractor BOOLEAN NOT NULL DEFAULT false,
  is_xfractor BOOLEAN NOT NULL DEFAULT false,
  is_numbered BOOLEAN NOT NULL DEFAULT false,
  is_insert BOOLEAN NOT NULL DEFAULT false,
  is_college BOOLEAN NOT NULL DEFAULT false,
  is_reprint_risk BOOLEAN NOT NULL DEFAULT false,
  is_damaged BOOLEAN NOT NULL DEFAULT false,
  numbered_print_run INT,
  card_count INT,
  price_per_card NUMERIC,
  value_score INT NOT NULL DEFAULT 0,
  flip_score INT NOT NULL DEFAULT 0,
  hold_score INT NOT NULL DEFAULT 0,
  risk_score INT NOT NULL DEFAULT 0,
  deal_score INT NOT NULL DEFAULT 0,
  recommendation TEXT NOT NULL DEFAULT 'WATCH',
  max_bid NUMERIC NOT NULL DEFAULT 0,
  estimated_market_value NUMERIC,
  reasoning TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyses public read" ON public.analyses FOR SELECT USING (true);
CREATE INDEX idx_analyses_deal_score ON public.analyses(deal_score DESC);
CREATE INDEX idx_analyses_recommendation ON public.analyses(recommendation);

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;

-- seed search terms
INSERT INTO public.search_terms (query, priority) VALUES
  ('NBA Topps Chrome', 3),
  ('NBA Refractor', 3),
  ('NBA X-Fractor', 3),
  ('NBA Xfractor', 2),
  ('NBA Auto', 3),
  ('NBA Autograph', 2),
  ('Basketkort NBA auto', 3),
  ('Basketkort refractor', 2),
  ('Topps Chrome basketball', 3),
  ('Panini Prizm NBA', 3),
  ('Prizm Silver NBA', 2),
  ('Rookie Auto NBA', 3),
  ('RC Refractor NBA', 2),
  ('Wembanyama Topps Chrome', 3),
  ('Cooper Flagg Chrome', 3),
  ('Anthony Edwards Refractor', 2),
  ('Shai Gilgeous Alexander Chrome', 2),
  ('LeBron Chrome', 2),
  ('Jordan basketball card', 2),
  ('Kobe rookie', 2),
  ('Pelle Larsson basketkort', 3),
  ('Bobi Klintman basketkort', 2),
  ('Lauri Markkanen card', 2),
  ('Panini National Treasures NBA', 1),
  ('Donruss Optic NBA', 1);
