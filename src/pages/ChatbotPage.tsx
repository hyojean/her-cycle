import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatbotPage.css';
import { useCalendarData } from '../context/CalendarDataContext';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureSupabaseSession } from '../lib/supabaseAuth';
import { isChatApiAvailable, CHAT_LIMITS } from '../lib/chatConfig';
import { sendChatCompletion, type ChatTurn } from '../services/chat';
import { getCyclePhaseForCalendarDay, type CyclePhase } from '../utils/cycleCalendar';

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstruation: '생리기',
  follicular: '난포기',
  ovulation: '배란기',
  luteal: '황체기',
};

const WELCOME_TEXT =
  '안녕하세요 해피님! 자궁이에요.\n오늘 컨디션은 어떠신가요?\n궁금한 점이 있다면 무엇이든 물어보세요!';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toChatTurns(messages: UiMessage[]): ChatTurn[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

function renderMessageText(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </span>
  ));
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { periodRecords } = useCalendarData();
  const chatEnabled = isChatApiAvailable();
  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<UiMessage[]>(() => [
    { id: 'welcome', role: 'assistant', content: WELCOME_TEXT },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    '생리통이 심한데 진통제 먹어도 될까요?',
    '생리 주기가 점점 불규칙해져요.',
    '이번 달 생리가 너무 지연되고 있어요.',
    '생리 전 증후군(PMS) 완화 방법이 있나요?',
  ];

  const cyclePhaseLabel = (() => {
    const t = new Date();
    const phase = getCyclePhaseForCalendarDay(
      periodRecords,
      t.getFullYear(),
      t.getMonth(),
      t.getDate()
    );
    return phase ? PHASE_LABELS[phase] : undefined;
  })();

  useEffect(() => {
    const el = historyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      if (trimmed.length > CHAT_LIMITS.USER_MESSAGE) {
        setError(`질문은 ${CHAT_LIMITS.USER_MESSAGE}자 이하로 입력해 주세요.`);
        return;
      }

      if (!chatEnabled) {
        setError('채팅 API가 설정되지 않았습니다. .env에 Supabase URL·anon key를 넣어 주세요.');
        return;
      }

      const sb = getSupabase();
      if (!sb) {
        setError('Supabase 클라이언트를 초기화할 수 없습니다.');
        return;
      }

      const userMsg: UiMessage = { id: newId(), role: 'user', content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setError(null);
      setSending(true);

      try {
        await ensureSupabaseSession(sb);
        const history = toChatTurns(nextMessages);
        const { content, error: apiError } = await sendChatCompletion(sb, history, {
          cyclePhaseLabel,
        });
        if (apiError) {
          setError(apiError);
          return;
        }
        if (content) {
          setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content }]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '답변을 받지 못했습니다.');
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [sending, chatEnabled, messages, cyclePhaseLabel]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void sendUserMessage(input);
  };

  return (
    <div className="chat-container">
      <div className="page-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">채팅</h1>
        <div style={{ width: 24 }} aria-hidden />
      </div>

      <div className="chat-header">
        <div className="disclaimer-banner">
          제공되는 답변은 의학적 효력이 없으며, 전문의의 진단을 대체하지 않습니다.
        </div>
        {!isSupabaseConfigured() ? (
          <p className="chat-config-hint" role="status">
            Supabase가 연결되면 AI 답변이 활성화됩니다.
          </p>
        ) : null}
        {error ? (
          <p className="chat-error-banner" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="chat-history" ref={historyRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble-wrapper ${msg.role === 'assistant' ? 'bot' : 'user'}`}
          >
            {msg.role === 'assistant' ? (
              <div className="bot-avatar">
                <img src="/images/character_uterus.png" alt="자궁이" className="bot-avatar-img" />
              </div>
            ) : null}
            <div className="chat-bubble">{renderMessageText(msg.content)}</div>
          </div>
        ))}
        {sending ? (
          <div className="chat-bubble-wrapper bot">
            <div className="bot-avatar">
              <img src="/images/character_uterus.png" alt="" className="bot-avatar-img" aria-hidden />
            </div>
            <div className="chat-bubble chat-bubble--typing" aria-live="polite">
              <Loader2 size={18} className="chat-spinner" aria-hidden />
              답변을 작성하고 있어요…
            </div>
          </div>
        ) : null}
      </div>

      <div className="chat-input-area">
        <div className="suggested-questions">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              type="button"
              className="suggestion-pill"
              disabled={sending}
              onClick={() => void sendUserMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>

        <form className="input-box-wrapper" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="자궁이에게 질문하기..."
            value={input}
            maxLength={CHAT_LIMITS.USER_MESSAGE}
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={sending || !input.trim()}
            aria-label="전송"
          >
            {sending ? <Loader2 size={16} className="chat-spinner" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
