export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function getCalendarDays(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const remaining = days.length % 7;
  if (remaining !== 0) {
    for (let i = 0; i < 7 - remaining; i++) {
      days.push(null);
    }
  }

  return days;
}

export function getFullCalendarDays(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: daysInPrevMonth - firstDay + i + 1, isPrevMonth: true, isNextMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isPrevMonth: false, isNextMonth: false });
  }

  const remaining = days.length % 7;
  if (remaining !== 0) {
    for (let i = 1; i <= 7 - remaining; i++) {
      days.push({ day: i, isPrevMonth: false, isNextMonth: true });
    }
  }

  return days;
}

export function formatDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 일정·일기 날짜 비교용: DB ISO 문자열 등 → YYYY-MM-DD */
export function toCalendarDateString(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : s;
}

function formatHmToKoLocale(hm: string): string {
  const parts = hm.trim().split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const min = parseInt(parts[1] ?? '0', 10);
  const d = new Date(2000, 0, 1, h, Number.isFinite(min) ? min : 0, 0, 0);
  return d.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * 일기 탭 일정 행: `5월 10일 오후 1:30 ~ 오후 2:30` 형태 (isoDate=YYYY-MM-DD, time=`HH:mm - HH:mm` 또는 종일)
 */
export function formatDiaryScheduleTimeLabel(isoDate: string, timeRange: string | null | undefined): string {
  const dateNorm = toCalendarDateString(isoDate);
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateNorm);
  const datePrefix = dm ? `${parseInt(dm[2], 10)}월 ${parseInt(dm[3], 10)}일` : '';

  const raw = (timeRange ?? '').trim();
  if (!datePrefix) return raw || '종일';

  if (!raw || raw === '종일') {
    return `${datePrefix} 종일`;
  }

  const rangeMatch = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(raw);
  if (rangeMatch) {
    return `${datePrefix} ${formatHmToKoLocale(rangeMatch[1])} ~ ${formatHmToKoLocale(rangeMatch[2])}`;
  }

  return `${datePrefix} ${raw}`;
}
