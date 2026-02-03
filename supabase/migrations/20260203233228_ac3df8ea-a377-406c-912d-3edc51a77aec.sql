-- Replace handle_new_user function with proper input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_language TEXT;
  v_display_name TEXT;
BEGIN
  -- Validate role from metadata - only allow 'narrator' or 'player'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'player');
  IF v_role NOT IN ('narrator', 'player') THEN
    v_role := 'player'; -- Force default for invalid roles
  END IF;
  
  -- Validate language - only allow 'pt-BR' or 'en'
  v_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR');
  IF v_language NOT IN ('pt-BR', 'en') THEN
    v_language := 'pt-BR'; -- Force default for invalid languages
  END IF;
  
  -- Limit display_name length to prevent abuse
  v_display_name := LEFT(NEW.raw_user_meta_data->>'display_name', 100);
  
  INSERT INTO public.profiles (user_id, role, display_name, language)
  VALUES (
    NEW.id,
    v_role,
    v_display_name,
    v_language
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;