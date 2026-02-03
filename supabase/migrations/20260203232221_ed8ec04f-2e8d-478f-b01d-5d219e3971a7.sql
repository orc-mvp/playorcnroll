-- Drop the policy we just created as it's still too permissive
DROP POLICY IF EXISTS "Authenticated users can find session by invite code" ON public.sessions;