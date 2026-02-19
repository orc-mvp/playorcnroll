
-- Create merits_flaws table for cross-system merits and flaws catalog
CREATE TABLE public.merits_flaws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'physical',
  prerequisites TEXT DEFAULT NULL,
  sourcebook TEXT DEFAULT NULL,
  game_systems TEXT[] NOT NULL DEFAULT '{vampiro_v3}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merits_flaws ENABLE ROW LEVEL SECURITY;

-- Anyone can read (game reference data)
CREATE POLICY "Anyone can view merits_flaws"
  ON public.merits_flaws FOR SELECT
  USING (true);

-- Only creator can insert
CREATE POLICY "Creator can insert merits_flaws"
  ON public.merits_flaws FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update
CREATE POLICY "Creator can update merits_flaws"
  ON public.merits_flaws FOR UPDATE
  USING (auth.uid() = created_by);

-- Only creator can delete
CREATE POLICY "Creator can delete merits_flaws"
  ON public.merits_flaws FOR DELETE
  USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_merits_flaws_updated_at
  BEFORE UPDATE ON public.merits_flaws
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
