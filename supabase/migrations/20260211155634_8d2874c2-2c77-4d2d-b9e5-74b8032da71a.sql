-- Remove overly permissive policy that exposes all sessions
DROP POLICY IF EXISTS "Anyone can view sessions by invite code" ON public.sessions;