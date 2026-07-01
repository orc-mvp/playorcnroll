ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS session_w5_harano integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_w5_hauglosk integer NOT NULL DEFAULT 0;