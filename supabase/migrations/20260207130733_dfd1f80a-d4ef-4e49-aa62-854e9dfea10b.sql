
-- Remover funcoes nao utilizadas em RLS
DROP FUNCTION IF EXISTS public.is_narrator(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Remover coluna role de profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Atualizar trigger para nao inserir role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_language TEXT;
  v_display_name TEXT;
BEGIN
  v_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR');
  IF v_language NOT IN ('pt-BR', 'en') THEN
    v_language := 'pt-BR';
  END IF;
  v_display_name := LEFT(NEW.raw_user_meta_data->>'display_name', 100);

  INSERT INTO public.profiles (user_id, display_name, language)
  VALUES (NEW.id, v_display_name, v_language);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
END;
$$;
