import type { SupabaseClient } from '@supabase/supabase-js';
import type { PeriodRecord } from '../utils/cycleCalendar';

export type PeriodRecordRow = {
  id: number;
  user_id: string;
  start_date: string;
  end_date: string | null;
};

function rowToPeriodRecord(row: PeriodRecordRow): PeriodRecord {
  return {
    start: row.start_date,
    end: row.end_date,
  };
}

export async function fetchPeriodRecords(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('period_records')
    .select('id, user_id, start_date, end_date')
    .order('start_date', { ascending: true });

  if (error) return { data: null as PeriodRecord[] | null, error };
  const rows = (data ?? []) as PeriodRecordRow[];
  return { data: rows.map(rowToPeriodRecord), error: null };
}

/** 기존 행을 모두 지우고 현재 목록으로 다시 넣습니다(클라이언트 상태가 단일 출처). */
export async function replacePeriodRecords(
  supabase: SupabaseClient,
  userId: string,
  records: PeriodRecord[]
) {
  const { error: delErr } = await supabase.from('period_records').delete().eq('user_id', userId);
  if (delErr) return { error: delErr };

  if (records.length === 0) return { error: null };

  const payload = records.map((r) => ({
    user_id: userId,
    start_date: r.start,
    end_date: r.end,
  }));

  const { error: insErr } = await supabase.from('period_records').insert(payload);
  return { error: insErr };
}
