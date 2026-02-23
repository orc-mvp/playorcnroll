
-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all events
CREATE POLICY "Authenticated users can view all calendar events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can insert calendar events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Creators can delete their own events
CREATE POLICY "Users can delete own calendar events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admin can delete any event
CREATE POLICY "Admin can delete any calendar event"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (auth.uid() = '8b192f50-8f9a-484e-aa64-d71af69fbdb8'::uuid);

-- Creators can update own events
CREATE POLICY "Users can update own calendar events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
