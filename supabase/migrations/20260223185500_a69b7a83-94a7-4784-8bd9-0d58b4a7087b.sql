
-- Allow authenticated users to read display_name from profiles (for calendar display)
CREATE POLICY "Authenticated users can view profiles display_name"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
