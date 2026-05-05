
-- Hard block flag on analyses (additive, default false)
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason text;

CREATE INDEX IF NOT EXISTS idx_analyses_blocked ON public.analyses(is_blocked);

-- ALERTS
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('HIGH_VALUE','ENDING_SOON')),
  triggered_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false,
  message text,
  deal_score integer,
  sniper_score integer,
  UNIQUE (listing_id, type)
);
CREATE INDEX idx_alerts_unread ON public.alerts(read, triggered_at DESC);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts public read" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "alerts public update" ON public.alerts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "alerts public delete" ON public.alerts FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- WATCHLIST
CREATE TABLE public.watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL UNIQUE,
  user_max_bid numeric,
  recommended_max_bid numeric,
  status text NOT NULL DEFAULT 'WAIT' CHECK (status IN ('WAIT','BID_NOW','SKIP')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist public read" ON public.watchlist_items FOR SELECT USING (true);
CREATE POLICY "watchlist public insert" ON public.watchlist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "watchlist public update" ON public.watchlist_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "watchlist public delete" ON public.watchlist_items FOR DELETE USING (true);

-- PORTFOLIO
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid,
  title text NOT NULL,
  player text,
  purchase_price numeric NOT NULL,
  shipping numeric NOT NULL DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (purchase_price + shipping) STORED,
  estimated_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'HOLD' CHECK (status IN ('HOLD','SELL','GRADE')),
  exit_platform text,           -- EBAY|TRADERA suggestion
  notes text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  sold_price numeric,
  sold_at timestamptz
);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio public read" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio public insert" ON public.portfolio_items FOR INSERT WITH CHECK (true);
CREATE POLICY "portfolio public update" ON public.portfolio_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "portfolio public delete" ON public.portfolio_items FOR DELETE USING (true);
