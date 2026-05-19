-- Calendar UI stores 시~종 시간 범위 문자열(e.g. "14:00 - 17:00") in schedules.time.
-- When the column was PostgreSQL TIME, 종료 시간이 들어가지 않거나 잘립니다 → TEXT 로 통일.
-- 원격에서 이미 TEXT 인 경우(수동 변경 등)는 건너뜁니다.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'schedules'
      AND column_name = 'time'
      AND data_type IN ('time without time zone', 'time with time zone')
  ) THEN
    ALTER TABLE public.schedules
      ALTER COLUMN "time" TYPE text USING (
        CASE
          WHEN "time" IS NULL THEN NULL::text
          ELSE to_char("time", 'HH24:MI')
        END
      );
  END IF;
END $$;
