export type PeriodRecord = {
  start: string;
  end: string | null;
};

export const PERIOD_RECORDS_STORAGE_KEY = 'women-cycle.calendar.periodRecords.v1';

function isPeriodRecord(x: unknown): x is PeriodRecord {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.start === 'string' && (o.end === null || typeof o.end === 'string');
}

export function loadPeriodRecordsFromStorage(): PeriodRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PERIOD_RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPeriodRecord);
  } catch {
    return [];
  }
}

export function persistPeriodRecordsToStorage(records: PeriodRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PERIOD_RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore quota / private mode
  }
}

/** 날짜 셀(자정 로컬)에서 delta일 이동 */
export function calendarAddDays(year: number, month0: number, day: number, delta: number): { y: number; m0: number; d: number } {
  const dt = new Date(year, month0, day + delta);
  return { y: dt.getFullYear(), m0: dt.getMonth(), d: dt.getDate() };
}

/** YYYY-MM-DD 정렬 비교 가능 */
export function isoDateString(y: number, month0: number, day: number): string {
  return `${y}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIsoDate(s: string): { y: number; month0: number; d: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { y, month0: m - 1, d };
}

/** anchor(포함) → target(포함)까지의 차이 일수. anchor가 target보다 미래면 음수 */
export function utcCalendarDaysBetween(
  ay: number,
  amonth0: number,
  ad: number,
  by: number,
  bmonth0: number,
  bd: number
): number {
  const a = Date.UTC(ay, amonth0, ad);
  const b = Date.UTC(by, bmonth0, bd);
  return Math.round((b - a) / 86400000);
}

export type CyclePhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

/** 28일 표준 표시: 생리기 5 · 난포기 6 · 배란기 7 · 황체기 나머지 (명시 종료일 없을 때만 이 5일 생리 규칙 사용) */
function phaseFromCanonicalDayIndex(dayIndexSincePeriodStart: number): CyclePhase {
  let p = dayIndexSincePeriodStart % 28;
  if (p < 0) p += 28;

  // 0-based: 첫째 날부터 5일 = 생리 | 6일 난포 | 7일 배란 | 10일 황체
  if (p <= 4) return 'menstruation';
  if (p <= 10) return 'follicular';
  if (p <= 17) return 'ovulation';
  return 'luteal';
}

/** 생리 종료일 등록 후: 실제 생리 일수(mLen)만큼만 생리색, 종료 다음날부터는 난포·배란·황체를 28일 틀 안에서 채운다 */
function phaseWithExplicitMenstrualLength(diff: number, mLen: number): CyclePhase {
  const len = Math.min(Math.max(mLen, 1), 28);
  let rel = diff % 28;
  if (rel < 0) rel += 28;

  if (rel < len) return 'menstruation';

  const t = rel - len;
  if (t < 6) return 'follicular';
  if (t < 13) return 'ovulation';
  return 'luteal';
}

/**
 * 캘린더 그리드의 한 칸(year, 월 인델스 0, day)에 대해 현재까지 등록된 생리 기록으로 주기 색 단계 계산.
 */
export function getCyclePhaseForCalendarDay(records: PeriodRecord[], cellYear: number, cellMonth0: number, cellDay: number): CyclePhase | null {
  if (records.length === 0) return null;

  const cellIso = isoDateString(cellYear, cellMonth0, cellDay);

  const sortedDesc = [...records].sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0));

  const anchor = sortedDesc.find((r) => r.start <= cellIso);
  if (!anchor) return null;

  const { y: ay, month0: am0, d: ad } = parseIsoDate(anchor.start);
  const diff = utcCalendarDaysBetween(ay, am0, ad, cellYear, cellMonth0, cellDay);
  if (diff < 0) return null;

  if (anchor.end && cellIso >= anchor.start && cellIso <= anchor.end) {
    return 'menstruation';
  }

  // 종료일이 있음: 종료 다음날부터는 "기본 5일 생리" canonical을 쓰면 안 됨(짧게 끝난 생리 다음날이 여전히 0–4 modulo에 걸림).
  if (anchor.end && cellIso > anchor.end) {
    const endParsed = parseIsoDate(anchor.end);
    const span = utcCalendarDaysBetween(ay, am0, ad, endParsed.y, endParsed.month0, endParsed.d);
    if (span < 0) {
      return phaseFromCanonicalDayIndex(diff);
    }
    const mLen = span + 1;
    return phaseWithExplicitMenstrualLength(diff, mLen);
  }

  return phaseFromCanonicalDayIndex(diff);
}
