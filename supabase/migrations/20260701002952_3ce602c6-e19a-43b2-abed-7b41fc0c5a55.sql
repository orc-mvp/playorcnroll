CREATE OR REPLACE FUNCTION public.join_session_with_code(p_invite_code text, p_character_id uuid, p_patch jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_session_id uuid;
  v_join_locked boolean;
  v_session_game_system text;
  v_allowed_systems text[];
  v_character_game_system text;
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

  SELECT id, join_locked, game_system, allowed_systems
  INTO v_session_id, v_join_locked, v_session_game_system, v_allowed_systems
  FROM public.sessions
  WHERE upper(invite_code) = v_code;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code' USING ERRCODE = 'P0002';
  END IF;

  SELECT game_system INTO v_character_game_system
  FROM public.characters
  WHERE id = p_character_id AND user_id = v_user;

  IF v_character_game_system IS NULL THEN
    RAISE EXCEPTION 'Character not owned by user' USING ERRCODE = '42501';
  END IF;

  IF v_session_game_system = 'storyteller' THEN
    IF COALESCE(array_length(v_allowed_systems, 1), 0) > 0 THEN
      IF NOT (v_character_game_system = ANY(v_allowed_systems)) THEN
        RAISE EXCEPTION 'Character system is not allowed in this session' USING ERRCODE = '42501';
      END IF;
    ELSIF v_character_game_system NOT IN ('vampiro_v3', 'lobisomem_w20', 'mago_m20', 'metamorfos_w20', 'lobisomem_w5', 'mago_m5') THEN
      RAISE EXCEPTION 'Character system is not allowed in this session' USING ERRCODE = '42501';
    END IF;
  ELSIF v_character_game_system <> v_session_game_system THEN
    RAISE EXCEPTION 'Character system is not allowed in this session' USING ERRCODE = '42501';
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
    session_paradox, session_quintessence, session_arete,
    session_w5_rage, session_w5_willpower_current, session_w5_harano, session_w5_hauglosk
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
    COALESCE((p_patch->>'session_arete')::int, 1),
    COALESCE((p_patch->>'session_w5_rage')::int, 0),
    COALESCE((p_patch->>'session_w5_willpower_current')::int, 0),
    COALESCE((p_patch->>'session_w5_harano')::int, 0),
    COALESCE((p_patch->>'session_w5_hauglosk')::int, 0)
  );

  RETURN v_session_id;
END;
$function$;