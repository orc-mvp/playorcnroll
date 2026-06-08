ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS session_w5_rage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_w5_willpower_current integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_w5_harmony integer NOT NULL DEFAULT 7;