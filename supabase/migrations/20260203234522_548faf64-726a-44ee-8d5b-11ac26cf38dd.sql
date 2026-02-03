-- Create security definer function to check session participation without RLS recursion
CREATE OR REPLACE FUNCTION public.is_session_participant(p_session_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_participants 
    WHERE session_id = p_session_id AND user_id = p_user_id
  );
$$;

-- Create security definer function to check if user is session narrator
CREATE OR REPLACE FUNCTION public.is_session_narrator(p_session_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE id = p_session_id AND narrator_id = p_user_id
  );
$$;

-- Drop and recreate the problematic policy for session_participants
DROP POLICY IF EXISTS "Participants can view other participants" ON public.session_participants;

CREATE POLICY "Participants can view other participants" 
ON public.session_participants 
FOR SELECT 
USING (
  public.is_session_participant(session_id, auth.uid()) 
  OR public.is_session_narrator(session_id, auth.uid())
);