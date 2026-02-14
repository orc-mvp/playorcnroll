
ALTER TABLE public.session_participants 
ADD COLUMN sheet_locked boolean NOT NULL DEFAULT true;

ALTER TABLE public.session_participants 
ADD COLUMN experience_points integer NOT NULL DEFAULT 0;
