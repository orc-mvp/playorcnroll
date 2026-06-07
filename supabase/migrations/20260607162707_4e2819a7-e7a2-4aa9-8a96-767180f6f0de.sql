DROP POLICY IF EXISTS "Narrators award or owner spend xp log" ON public.xp_log;

CREATE POLICY "Narrators award or owner spend xp log"
ON public.xp_log
FOR INSERT
WITH CHECK (
  auth.uid() = awarded_by
  AND (
    (
      session_id IS NOT NULL
      AND public.is_session_narrator(session_id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.session_participants sp
        WHERE sp.session_id = xp_log.session_id
          AND sp.character_id = xp_log.character_id
      )
    )
    OR (
      amount < 0
      AND EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = xp_log.character_id AND c.user_id = auth.uid()
      )
    )
  )
);