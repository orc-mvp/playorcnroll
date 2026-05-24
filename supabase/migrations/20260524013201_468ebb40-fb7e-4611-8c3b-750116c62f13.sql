
CREATE TABLE public.xp_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL,
  session_id UUID,
  awarded_by UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_log_character ON public.xp_log(character_id, created_at DESC);

ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

-- Character owner can view their own XP log
CREATE POLICY "Character owner can view xp log"
ON public.xp_log FOR SELECT
USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = xp_log.character_id AND c.user_id = auth.uid()));

-- Narrators of the session can view xp log entries from their session
CREATE POLICY "Session narrator can view xp log"
ON public.xp_log FOR SELECT
USING (session_id IS NOT NULL AND public.is_session_narrator(session_id, auth.uid()));

-- Anyone awarding (the awarding user) can insert; typically narrators or character owner (for negative reductions)
CREATE POLICY "Narrators can insert xp log"
ON public.xp_log FOR INSERT
WITH CHECK (
  auth.uid() = awarded_by AND (
    (session_id IS NOT NULL AND public.is_session_narrator(session_id, auth.uid()))
    OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = xp_log.character_id AND c.user_id = auth.uid())
  )
);
