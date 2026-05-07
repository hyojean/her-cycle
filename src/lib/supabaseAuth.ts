import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * RLS가 `auth.uid()`를 쓰므로, 최소 한 번 세션이 필요합니다.
 * 대시보드에서 Anonymous 로그인을 켠 뒤 익명 세션을 발급합니다.
 * @see https://supabase.com/docs/guides/auth/auth-anonymous
 */
export async function ensureSupabaseSession(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}
