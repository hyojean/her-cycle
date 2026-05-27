import { isSupabaseConfigured } from './supabase';

/** 채팅 API는 Supabase Edge Function `chat` + GEMINI_API_KEY 시크릿이 필요합니다. */
export function isChatApiAvailable(): boolean {
  return isSupabaseConfigured();
}

export const CHAT_LIMITS = {
  USER_MESSAGE: 500,
  /** API에 보낼 대화 턴 수( user+assistant 쌍 기준으로 최근 N개 메시지 ) */
  MAX_HISTORY_MESSAGES: 20,
} as const;
