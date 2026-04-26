ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS experience_points integer NOT NULL DEFAULT 0;

-- Migrar XP existente: somar todos os XP de session_participants por character_id
UPDATE public.characters c
SET experience_points = COALESCE(sub.total, 0)
FROM (
  SELECT character_id, SUM(experience_points)::int AS total
  FROM public.session_participants
  WHERE character_id IS NOT NULL
  GROUP BY character_id
) sub
WHERE c.id = sub.character_id;

-- Remover coluna por sessão (XP agora é global por personagem)
ALTER TABLE public.session_participants DROP COLUMN IF EXISTS experience_points;