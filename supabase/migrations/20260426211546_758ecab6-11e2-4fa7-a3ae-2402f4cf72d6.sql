-- Adiciona controle de quais sistemas WoD são aceitos numa sessão Storyteller
ALTER TABLE public.sessions
ADD COLUMN allowed_systems text[] NOT NULL DEFAULT '{}';

-- Backfill: preserva o comportamento legado das sessões existentes
-- Sessões com game_system específico viram allowed=[esse sistema]
UPDATE public.sessions
SET allowed_systems = ARRAY[game_system]
WHERE game_system IN ('vampiro_v3', 'lobisomem_w20', 'mago_m20', 'metamorfos_w20')
  AND (allowed_systems IS NULL OR cardinality(allowed_systems) = 0);

-- Sessões 'storyteller' antigas (sem allowed definido) ganham todos os sistemas atualmente disponíveis
UPDATE public.sessions
SET allowed_systems = ARRAY['vampiro_v3', 'lobisomem_w20']
WHERE game_system = 'storyteller'
  AND (allowed_systems IS NULL OR cardinality(allowed_systems) = 0);

-- Heróis Marcados ganha o próprio id (não usado pela lógica Storyteller mas mantém consistência)
UPDATE public.sessions
SET allowed_systems = ARRAY['herois_marcados']
WHERE game_system = 'herois_marcados'
  AND (allowed_systems IS NULL OR cardinality(allowed_systems) = 0);