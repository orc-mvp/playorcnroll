DROP POLICY IF EXISTS "Admin can delete any calendar event" ON public.calendar_events;

CREATE POLICY "Admins can delete any calendar event"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));