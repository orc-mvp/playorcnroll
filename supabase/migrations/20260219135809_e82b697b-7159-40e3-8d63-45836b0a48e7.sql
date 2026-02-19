
-- Drop existing restrictive policies
DROP POLICY "Creator can update merits_flaws" ON public.merits_flaws;
DROP POLICY "Creator can delete merits_flaws" ON public.merits_flaws;

-- Recreate with admin override for your user
CREATE POLICY "Creator or admin can update merits_flaws"
ON public.merits_flaws FOR UPDATE
USING (auth.uid() = created_by OR auth.uid() = '8b192f50-8f9a-484e-aa64-d71af69fbdb8'::uuid);

CREATE POLICY "Creator or admin can delete merits_flaws"
ON public.merits_flaws FOR DELETE
USING (auth.uid() = created_by OR auth.uid() = '8b192f50-8f9a-484e-aa64-d71af69fbdb8'::uuid);
