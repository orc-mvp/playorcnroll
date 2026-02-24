-- Add werewolf-specific columns to session_participants
ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS session_gnosis integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_rage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_form text DEFAULT 'hominid';