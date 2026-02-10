
-- Add UPDATE policy for session_participants: players can only update their own records
CREATE POLICY "Players can update own participant data"
ON public.session_participants
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
