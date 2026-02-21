
-- Create XP log table to track experience point awards
CREATE TABLE public.xp_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  narrator_id UUID NOT NULL,
  narrator_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

-- Character owners can view their XP log
CREATE POLICY "Character owners can view xp_log"
ON public.xp_log
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM characters WHERE characters.id = xp_log.character_id AND characters.user_id = auth.uid()
));

-- Narrators can view XP log for session characters
CREATE POLICY "Narrators can view session xp_log"
ON public.xp_log
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM session_participants sp
  JOIN sessions s ON s.id = sp.session_id
  WHERE sp.character_id = xp_log.character_id AND s.narrator_id = auth.uid()
));

-- Narrators can insert XP log entries
CREATE POLICY "Narrators can insert xp_log"
ON public.xp_log
FOR INSERT
WITH CHECK (auth.uid() = narrator_id);

-- Enable realtime for xp_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_log;
