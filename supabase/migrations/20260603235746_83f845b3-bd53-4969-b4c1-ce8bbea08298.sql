
-- 1) session_participants: require RPC to join (server-side invite validation)
CREATE OR REPLACE FUNCTION public.join_session_with_code(
  p_invite_code text,
  p_character_id uuid,
  p_patch jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_session_id uuid;
  v_join_locked boolean;
  v_existing uuid;
  v_code text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  v_code := upper(trim(p_invite_code));
  IF v_code !~ '^[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'Invalid invite code format' USING ERRCODE = '22023';
  END IF;

  SELECT id, join_locked INTO v_session_id, v_join_locked
  FROM public.sessions WHERE upper(invite_code) = v_code;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.characters WHERE id = p_character_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Character not owned by user' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_existing FROM public.session_participants
  WHERE session_id = v_session_id AND user_id = v_user;

  IF v_existing IS NOT NULL THEN
    RETURN v_session_id;
  END IF;

  IF v_join_locked THEN
    RAISE EXCEPTION 'Session is locked for new players' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.session_participants (
    session_id, user_id, character_id,
    session_blood_pool, session_willpower_current, session_health_damage,
    session_gnosis, session_rage, session_form,
    session_paradox, session_quintessence, session_arete
  ) VALUES (
    v_session_id, v_user, p_character_id,
    COALESCE((p_patch->>'session_blood_pool')::int, 0),
    COALESCE((p_patch->>'session_willpower_current')::int, 0),
    COALESCE(p_patch->'session_health_damage', '[]'::jsonb),
    COALESCE((p_patch->>'session_gnosis')::int, 0),
    COALESCE((p_patch->>'session_rage')::int, 0),
    COALESCE(p_patch->>'session_form', 'hominid'),
    COALESCE((p_patch->>'session_paradox')::int, 0),
    COALESCE((p_patch->>'session_quintessence')::int, 0),
    COALESCE((p_patch->>'session_arete')::int, 1)
  );

  RETURN v_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_session_with_code(text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_session_with_code(text, uuid, jsonb) TO authenticated;

-- Remove the permissive direct insert; narrator ALL policy still allows narrator-side inserts.
DROP POLICY IF EXISTS "Players can join sessions" ON public.session_participants;

-- 2) test_rolls: require session membership + character ownership
DROP POLICY IF EXISTS "Players can insert own rolls" ON public.test_rolls;
CREATE POLICY "Players can insert own rolls" ON public.test_rolls
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = test_rolls.character_id AND c.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.tests t
    JOIN public.session_participants sp ON sp.session_id = t.session_id
    WHERE t.id = test_rolls.test_id AND sp.user_id = auth.uid()
  )
);

-- 3) xp_log: character owners can only log spending (negative amounts)
DROP POLICY IF EXISTS "Narrators can insert xp log" ON public.xp_log;
CREATE POLICY "Narrators award or owner spend xp log" ON public.xp_log
FOR INSERT WITH CHECK (
  auth.uid() = awarded_by AND (
    (session_id IS NOT NULL AND public.is_session_narrator(session_id, auth.uid()))
    OR (
      amount < 0
      AND EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = xp_log.character_id AND c.user_id = auth.uid()
      )
    )
  )
);

-- 4) Lock down security-definer helpers from anon
REVOKE EXECUTE ON FUNCTION public.is_session_narrator(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_session_participant(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_session_narrator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_participant(uuid, uuid) TO authenticated;
