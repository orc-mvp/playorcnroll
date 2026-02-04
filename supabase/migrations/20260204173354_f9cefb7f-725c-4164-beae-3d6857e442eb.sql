-- Allow session participants (players) to insert events
CREATE POLICY "Session participants can insert events"
ON public.session_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_participants.session_id = session_events.session_id
    AND session_participants.user_id = auth.uid()
  )
);