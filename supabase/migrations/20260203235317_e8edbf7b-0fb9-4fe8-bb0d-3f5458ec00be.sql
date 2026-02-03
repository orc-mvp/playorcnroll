-- Drop and recreate the problematic policy for sessions
DROP POLICY IF EXISTS "Participants can view sessions" ON public.sessions;

CREATE POLICY "Participants can view sessions" 
ON public.sessions 
FOR SELECT 
USING (
  public.is_session_participant(id, auth.uid())
);