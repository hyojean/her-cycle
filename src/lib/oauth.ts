import { getSupabase, isSupabaseConfigured } from './supabase';

export type SocialProvider = 'google' | 'kakao';

export async function signInWithSocialProvider(provider: SocialProvider) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase 환경 변수가 설정되어 있지 않습니다.');
  }

  const sb = getSupabase();
  if (!sb) {
    throw new Error('Supabase 클라이언트를 초기화하지 못했습니다.');
  }

  const redirectTo = `${window.location.origin}/`;
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) throw error;
}
