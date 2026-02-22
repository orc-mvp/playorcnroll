CREATE POLICY "Session participants can view session characters"
ON public.characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM session_participants sp
    JOIN session_participants sp2 ON sp2.session_id = sp.session_id
    WHERE sp2.character_id = characters.id
      AND sp.user_id = auth.uid()
  )
);