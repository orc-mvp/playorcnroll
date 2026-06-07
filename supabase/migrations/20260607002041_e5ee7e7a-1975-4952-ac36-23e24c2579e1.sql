
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
    'complication_manifested',
    'vampire_test_result',
    'group_test_completed'
  )
);
