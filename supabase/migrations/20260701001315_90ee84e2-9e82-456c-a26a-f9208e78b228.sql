DROP POLICY IF EXISTS "Players can update own rolls" ON public.test_rolls;
CREATE POLICY "Players can update own rolls"
ON public.test_rolls
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.characters c WHERE c.id = test_rolls.character_id AND c.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.tests t
    JOIN public.session_participants sp ON sp.session_id = t.session_id
    WHERE t.id = test_rolls.test_id AND sp.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.characters c WHERE c.id = test_rolls.character_id AND c.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.tests t
    JOIN public.session_participants sp ON sp.session_id = t.session_id
    WHERE t.id = test_rolls.test_id AND sp.user_id = auth.uid()
  )
);