-- Create a security definer function to get user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = p_user_id LIMIT 1;
$$;

-- Create a function to check if user is narrator
CREATE OR REPLACE FUNCTION public.is_narrator(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = p_user_id AND role = 'narrator'
  );
$$;