-- Add session-specific vampire trackers to session_participants
-- These track the current state during a session (separate from character base stats)

ALTER TABLE public.session_participants 
ADD COLUMN IF NOT EXISTS session_blood_pool INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_willpower_current INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_health_damage JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.session_participants.session_blood_pool IS 'Current blood pool during this session (0-50)';
COMMENT ON COLUMN public.session_participants.session_willpower_current IS 'Current willpower points spent during this session';
COMMENT ON COLUMN public.session_participants.session_health_damage IS 'Array of health levels damaged [bruised, hurt, injured, wounded, mauled, crippled, incapacitated]';