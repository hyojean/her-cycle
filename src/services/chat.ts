import type { SupabaseClient } from '@supabase/supabase-js';
import { CHAT_LIMITS } from '../lib/chatConfig';

export type ChatRole = 'user' | 'assistant';

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type ChatContext = {
  cyclePhaseLabel?: string;
};

function trimHistory(messages: ChatTurn[]): ChatTurn[] {
  const trimmed = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim())
    .slice(-CHAT_LIMITS.MAX_HISTORY_MESSAGES);
  return trimmed;
}

export async function sendChatCompletion(
  supabase: SupabaseClient,
  messages: ChatTurn[],
  context?: ChatContext
): Promise<{ content: string | null; error: string | null }> {
  const payload = trimHistory(messages);
  if (payload.length === 0) {
    return { content: null, error: '보낼 메시지가 없습니다.' };
  }

  const last = payload[payload.length - 1];
  if (last.role === 'user' && last.content.length > CHAT_LIMITS.USER_MESSAGE) {
    return {
      content: null,
      error: `질문은 ${CHAT_LIMITS.USER_MESSAGE}자 이하로 입력해 주세요.`,
    };
  }

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { messages: payload, context },
  });

  if (error) {
    return { content: null, error: error.message || '채팅 요청에 실패했습니다.' };
  }

  const record = data as { content?: string; error?: string } | null;
  if (record?.error) {
    return { content: null, error: record.error };
  }
  if (typeof record?.content === 'string' && record.content.trim()) {
    return { content: record.content.trim(), error: null };
  }

  return { content: null, error: '응답을 받지 못했습니다.' };
}
