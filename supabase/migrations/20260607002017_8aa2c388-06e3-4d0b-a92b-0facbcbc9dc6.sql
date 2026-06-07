
-- 1) Remove subscriptions from Realtime publication (prevent broadcast of sensitive billing data)
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;

-- 2) Restrict session_events INSERT by players to a safe allowlist of event_types
DROP POLICY IF EXISTS "Session participants can insert events" ON public.session_events;
CREATE POLICY "Session participants can insert events"
ON public.session_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.session_participants
    WHERE session_participants.session_id = session_events.session_id
      AND session_participants.user_id = auth.uid()
  )
  AND event_type IN (
    'dice_rolled',
    'pull_group',
    'critical_state',
    'tracker_change',
    'player_action',
    'character_note',
    'heroic_move',
    'form_change',
    'complication_manifested'
  )
);

-- 3) Restrict session-scoped minor_marks visibility to narrator + session participants
DROP POLICY IF EXISTS "Anyone can view minor marks" ON public.minor_marks;
CREATE POLICY "View global or session-scoped minor marks"
ON public.minor_marks
FOR SELECT
USING (
  session_id IS NULL
  OR auth.uid() = created_by
  OR public.is_session_narrator(session_id, auth.uid())
  OR public.is_session_participant(session_id, auth.uid())
);

-- 4) xp_log: ensure narrator can only award XP to characters actually in the session
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
