import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_USER_MESSAGE_CHARS = 500;
const MAX_HISTORY_MESSAGES = 20;
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type ChatRole = "user" | "assistant";
type IncomingMessage = { role: ChatRole; content: string };

type ChatRequestBody = {
  messages?: IncomingMessage[];
  context?: { cyclePhaseLabel?: string };
};

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(cyclePhaseLabel?: string): string {
  const phaseLine = cyclePhaseLabel
    ? `사용자의 오늘 추정 주기 단계: ${cyclePhaseLabel}. 이 맥락을 참고하되 단정하지 마세요.`
    : "사용자의 주기 데이터가 없을 수 있습니다.";

  return [
    "당신은 여성 건강·월경 주기 앱 'her-cycle'의 AI 도우미 '자궁이'입니다.",
    "따뜻하고 존중하는 한국어로 답하세요. 이모지는 과하지 않게 사용합니다.",
    phaseLine,
    "의학적 진단·처방·응급 판단은 하지 않습니다. 심각한 증상에는 전문의 상담을 권합니다.",
    "확실하지 않은 내용은 추측하지 말고, 일반적인 건강 정보 수준에서 안내합니다.",
  ].join("\n");
}

function toGeminiContents(messages: IncomingMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n\n${m.content}`;
    } else {
      contents.push({ role, parts: [{ text: m.content }] });
    }
  }
  return contents;
}

function extractGeminiText(data: Record<string, unknown>): string | null {
  const candidates = data.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const first = candidates[0] as Record<string, unknown>;
  const content = first.content as Record<string, unknown> | undefined;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;
  const texts = parts
    .map((p) => {
      const part = p as Record<string, unknown>;
      return typeof part.text === "string" ? part.text : "";
    })
    .filter(Boolean);
  const joined = texts.join("").trim();
  return joined || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return jsonResponse(
      {
        error:
          "GEMINI_API_KEY가 설정되지 않았습니다. Supabase 대시보드 → Edge Functions → Secrets에서 등록하세요.",
      },
      503
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Supabase 환경 변수가 없습니다." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "인증 헤더가 필요합니다." }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "로그인 세션이 유효하지 않습니다." }, 401);
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonResponse({ error: "요청 본문이 올바르지 않습니다." }, 400);
  }

  const rawMessages = body.messages ?? [];
  if (rawMessages.length === 0) {
    return jsonResponse({ error: "messages가 비어 있습니다." }, 400);
  }

  const messages: IncomingMessage[] = [];
  for (const m of rawMessages.slice(-MAX_HISTORY_MESSAGES)) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) continue;
    if (m.role === "user" && content.length > MAX_USER_MESSAGE_CHARS) {
      return jsonResponse(
        { error: `질문은 ${MAX_USER_MESSAGE_CHARS}자 이하로 입력해 주세요.` },
        400
      );
    }
    messages.push({ role: m.role, content });
  }

  if (messages.length === 0) {
    return jsonResponse({ error: "유효한 메시지가 없습니다." }, 400);
  }

  const model = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;

  const geminiRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(body.context?.cyclePhaseLabel) }],
      },
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    }),
  });

  const geminiData = (await geminiRes.json()) as Record<string, unknown>;
  if (!geminiRes.ok) {
    const err = geminiData.error as Record<string, unknown> | undefined;
    const msg =
      typeof err?.message === "string" ? err.message : "Gemini API 오류";
    console.error("Gemini error", geminiRes.status, geminiData);
    return jsonResponse({ error: msg }, 502);
  }

  const content = extractGeminiText(geminiData);
  if (!content) {
    return jsonResponse({ error: "응답을 생성하지 못했습니다." }, 502);
  }

  return jsonResponse({ content });
});
