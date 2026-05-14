-- Add server-side length constraints to schedules table.
-- Keep these in sync with TEXT_LIMITS in src/lib/limits.ts.

ALTER TABLE public.schedules
  ADD CONSTRAINT schedules_title_len_chk
    CHECK (char_length(title) <= 80),
  ADD CONSTRAINT schedules_time_len_chk
    CHECK (time IS NULL OR char_length(time) <= 30),
  ADD CONSTRAINT schedules_old_time_len_chk
    CHECK (old_time IS NULL OR char_length(old_time) <= 30),
  ADD CONSTRAINT schedules_rec_time_len_chk
    CHECK (rec_time IS NULL OR char_length(rec_time) <= 30),
  ADD CONSTRAINT schedules_rec_desc_len_chk
    CHECK (rec_desc IS NULL OR char_length(rec_desc) <= 300);
