-- App expects these columns on public.schedules (PGRST204 if missing).
-- Run on team project if schedules was created without recommendation fields.

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS has_rec BOOLEAN DEFAULT false;

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS old_time TEXT;

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS rec_time TEXT;

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS rec_desc TEXT;
