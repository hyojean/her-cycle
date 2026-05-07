import type { SupabaseClient } from '@supabase/supabase-js';

export type ScheduleRow = {
  id: number;
  user_id: string | null;
  title: string;
  date: string;
  time: string | null;
  has_rec: boolean;
  old_time: string | null;
  rec_time: string | null;
  rec_desc: string | null;
};

export type CalendarEventInput = {
  title: string;
  date: string;
  time: string;
  hasRec: boolean;
  oldTime?: string;
  recTime?: string;
  recDesc?: string;
};

function rowToInput(row: ScheduleRow): CalendarEventInput {
  return {
    title: row.title,
    date: row.date,
    time: row.time ?? '종일',
    hasRec: row.has_rec,
    oldTime: row.old_time ?? undefined,
    recTime: row.rec_time ?? undefined,
    recDesc: row.rec_desc ?? undefined,
  };
}

export function scheduleRowToEvent(row: ScheduleRow): {
  id: number;
  title: string;
  time: string;
  date: string;
  hasRec: boolean;
  oldTime?: string;
  recTime?: string;
  recDesc?: string;
} {
  const base = rowToInput(row);
  return { id: row.id, ...base };
}

function eventToRowPayload(
  input: CalendarEventInput,
  userId: string
): Omit<ScheduleRow, 'id'> {
  return {
    user_id: userId,
    title: input.title,
    date: input.date,
    time: input.time === '종일' ? null : input.time,
    has_rec: input.hasRec,
    old_time: input.oldTime ?? null,
    rec_time: input.recTime ?? null,
    rec_desc: input.recDesc ?? null,
  };
}

export async function fetchSchedules(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('date', { ascending: true })
    .order('id', { ascending: true });

  if (error) return { data: null as ScheduleRow[] | null, error };
  return { data: data as ScheduleRow[], error: null };
}

export async function insertSchedule(supabase: SupabaseClient, userId: string, input: CalendarEventInput) {
  const payload = eventToRowPayload(input, userId);
  const { data, error } = await supabase.from('schedules').insert(payload).select('*').single();

  if (error) return { data: null as ScheduleRow | null, error };
  return { data: data as ScheduleRow, error: null };
}

export async function updateSchedule(
  supabase: SupabaseClient,
  id: number,
  input: CalendarEventInput
) {
  const { data, error } = await supabase
    .from('schedules')
    .update({
      title: input.title,
      date: input.date,
      time: input.time === '종일' ? null : input.time,
      has_rec: input.hasRec,
      old_time: input.oldTime ?? null,
      rec_time: input.recTime ?? null,
      rec_desc: input.recDesc ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { data: null as ScheduleRow | null, error };
  return { data: data as ScheduleRow, error: null };
}

export async function deleteSchedule(supabase: SupabaseClient, id: number) {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  return { error };
}
