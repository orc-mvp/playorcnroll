-- Allow session narrators to update characters that are in their sessions
CREATE POLICY "Narrators can update session characters"
ON public.characters
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM session_participants sp
    JOIN sessions s ON s.id = sp.session_id
    WHERE sp.character_id = characters.id
      AND s.narrator_id = auth.uid()
  )
);
