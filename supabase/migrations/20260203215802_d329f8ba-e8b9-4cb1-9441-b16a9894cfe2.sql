-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a permissive INSERT policy instead
-- This allows the trigger to insert (since it runs as SECURITY DEFINER)
-- and also allows users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add a policy to allow the trigger function to insert
-- The trigger runs as the function owner (postgres), so we need to allow public inserts
-- but still validate the data in the trigger itself
CREATE POLICY "Allow trigger profile creation"
ON public.profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);