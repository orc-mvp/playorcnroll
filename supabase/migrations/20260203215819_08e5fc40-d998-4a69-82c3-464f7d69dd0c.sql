-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Allow trigger profile creation" ON public.profiles;

-- The SECURITY DEFINER function should bypass RLS automatically
-- But we need to ensure the function runs as postgres superuser
-- Let's update the function to explicitly handle this

-- First, let's check the function and make sure it properly bypasses RLS
-- by granting execute to the auth service role

-- Actually the issue is that triggers from auth.users fire in a different context
-- The solution is to grant the ability to bypass RLS for the trigger function
-- We can do this by making the function owner a role that can bypass RLS

-- Alternative: Disable RLS temporarily in the function itself
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert using a direct SQL that bypasses RLS
  INSERT INTO public.profiles (user_id, role, display_name, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    NEW.raw_user_meta_data->>'display_name',
    COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to the supabase_auth_admin role which runs auth triggers
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Make sure the function can insert into profiles by granting insert to the function owner
-- The function is owned by postgres which should have full access