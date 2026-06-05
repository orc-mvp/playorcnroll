
CREATE OR REPLACE FUNCTION public.guard_session_participant_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_narrator boolean;
BEGIN
  -- Narrators (via "Narrators can manage participants" policy) bypass these restrictions.
  v_is_narrator := public.is_session_narrator(OLD.session_id, auth.uid());
  IF v_is_narrator THEN
    RETURN NEW;
  END IF;

  -- Player updating their own row: lock down sensitive columns.
  IF NEW.session_id IS DISTINCT FROM OLD.session_id THEN
    RAISE EXCEPTION 'Players cannot change session_id' USING ERRCODE = '42501';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Players cannot change user_id' USING ERRCODE = '42501';
  END IF;
  IF NEW.character_id IS DISTINCT FROM OLD.character_id THEN
    RAISE EXCEPTION 'Players cannot change character_id' USING ERRCODE = '42501';
  END IF;
  IF NEW.sheet_locked IS DISTINCT FROM OLD.sheet_locked THEN
    RAISE EXCEPTION 'Only the narrator can change sheet_locked' USING ERRCODE = '42501';
  END IF;
  IF NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
    RAISE EXCEPTION 'Players cannot change joined_at' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_session_participant_update_trg ON public.session_participants;
CREATE TRIGGER guard_session_participant_update_trg
  BEFORE UPDATE ON public.session_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_session_participant_update();
