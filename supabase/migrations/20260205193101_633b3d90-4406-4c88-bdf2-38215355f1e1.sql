-- Add column for Vampiro-specific character data
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS vampiro_data jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.characters.vampiro_data IS 'Stores Vampiro 3rd Edition specific character data including attributes, abilities, disciplines, etc.';