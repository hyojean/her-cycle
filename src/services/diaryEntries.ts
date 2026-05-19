import type { SupabaseClient } from '@supabase/supabase-js';

export type DiaryEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  body: string;
  recorded_at: string;
};

export async function fetchDiaryEntries(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, user_id, entry_date, body, recorded_at')
    .order('entry_date', { ascending: false })
    .order('recorded_at', { ascending: false });

  if (error) return { data: null as DiaryEntryRow[] | null, error };
  return { data: (data ?? []) as DiaryEntryRow[], error: null };
}

export async function insertDiaryEntry(
  supabase: SupabaseClient,
  userId: string,
  input: { entryDate: string; body: string; recordedAt: string }
) {
  const { data, error } = await supabase
    .from('diary_entries')
    .insert({
      user_id: userId,
      entry_date: input.entryDate,
      body: input.body,
      recorded_at: input.recordedAt,
    })
    .select('id, user_id, entry_date, body, recorded_at')
    .single();

  if (error) return { data: null as DiaryEntryRow | null, error };
  return { data: data as DiaryEntryRow, error: null };
}

export async function updateDiaryEntry(supabase: SupabaseClient, id: string, body: string) {
  const { data, error } = await supabase
    .from('diary_entries')
    .update({ body })
    .eq('id', id)
    .select('id, user_id, entry_date, body, recorded_at')
    .single();

  if (error) return { data: null as DiaryEntryRow | null, error };
  return { data: data as DiaryEntryRow, error: null };
}

export async function deleteDiaryEntry(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('diary_entries').delete().eq('id', id);
  return { error };
}
