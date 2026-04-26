
-- Adiciona campos de tracker de sessão para Mago (Quintessência, Paradoxo, Arête)
ALTER TABLE public.session_participants
ADD COLUMN IF NOT EXISTS session_quintessence integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_paradox integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_arete integer DEFAULT 1;
