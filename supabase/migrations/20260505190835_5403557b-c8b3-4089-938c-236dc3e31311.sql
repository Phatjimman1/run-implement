CREATE TABLE public.condition_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT,
  overlay_image_url TEXT,
  condition_score INTEGER NOT NULL DEFAULT 0,
  condition_label TEXT NOT NULL DEFAULT 'UNREADABLE',
  psa_potential TEXT NOT NULL DEFAULT 'UNKNOWN',
  confidence TEXT NOT NULL DEFAULT 'LOW',
  condition_advice TEXT NOT NULL DEFAULT 'ASK_FOR_MORE_PHOTOS',
  image_quality JSONB NOT NULL DEFAULT '{}'::jsonb,
  centering JSONB NOT NULL DEFAULT '{}'::jsonb,
  corners JSONB NOT NULL DEFAULT '{}'::jsonb,
  edges JSONB NOT NULL DEFAULT '{}'::jsonb,
  surface JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_condition_analyses_listing ON public.condition_analyses(listing_id);

ALTER TABLE public.condition_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "condition_analyses public read"
  ON public.condition_analyses FOR SELECT USING (true);
CREATE POLICY "condition_analyses public insert"
  ON public.condition_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "condition_analyses public update"
  ON public.condition_analyses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "condition_analyses public delete"
  ON public.condition_analyses FOR DELETE USING (true);