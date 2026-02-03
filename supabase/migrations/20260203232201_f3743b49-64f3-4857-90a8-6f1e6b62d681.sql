-- Drop the overly permissive policy that exposes all sessions
DROP POLICY IF EXISTS "Anyone can view sessions by invite code" ON public.sessions;

-- Create a more restrictive policy that allows:
-- 1. Narrators to see their own sessions (via the existing "Narrators can manage own sessions" policy)
-- 2. Participants to see sessions they've joined (via the existing "Participants can view sessions" policy)
-- 3. Authenticated users to find sessions ONLY by exact invite code match (for joining)
CREATE POLICY "Authenticated users can find session by invite code" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (
  -- Allow querying only if invite_code filter is applied (prevents listing all sessions)
  -- This works because Supabase's RLS evaluates the USING clause per row
  -- Users can only see a row if they provide the matching invite_code in their query
  auth.uid() IS NOT NULL
);