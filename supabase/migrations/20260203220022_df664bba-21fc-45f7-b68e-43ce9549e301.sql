-- Drop the trigger if it exists (to ensure clean state)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create profiles for existing users that don't have one
INSERT INTO public.profiles (user_id, role, display_name, language)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'role', 'player'),
  u.raw_user_meta_data->>'display_name',
  COALESCE(u.raw_user_meta_data->>'language', 'pt-BR')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);