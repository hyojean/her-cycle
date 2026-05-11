-- Calendar UI stores 시~종 시간 범위 문자열(e.g. "14:00 - 17:00") in schedules.time.
-- When the column was PostgreSQL TIME, 종료 시간이 들어가지 않거나 잘립니다 → TEXT 로 통일.

ALTER TABLE public.schedules
  ALTER COLUMN "time" TYPE text USING (
    CASE
      WHEN "time" IS NULL THEN NULL::text
      ELSE to_char("time", 'HH24:MI')
    END
  );
