DROP POLICY IF EXISTS "Creator or admin can update merits_flaws" ON public.merits_flaws;
DROP POLICY IF EXISTS "Creator or admin can delete merits_flaws" ON public.merits_flaws;

CREATE POLICY "Creator or admin can update merits_flaws"
ON public.merits_flaws FOR UPDATE
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creator or admin can delete merits_flaws"
ON public.merits_flaws FOR DELETE
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));