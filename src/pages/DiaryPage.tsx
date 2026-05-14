import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, X } from 'lucide-react';
import './CalendarPage.css';
import './HomePage.css';
import './DiaryPage.css';
import heroIcon from '../assets/calendar_hero_3d_icon.png';
import {
  formatDiaryScheduleTimeLabel,
  getFullCalendarDays,
  formatDateString,
  toCalendarDateString,
} from '../utils/date';
import { calendarAddDays, getCyclePhaseForCalendarDay, type CyclePhase } from '../utils/cycleCalendar';
import { useCalendarData } from '../context/CalendarDataContext';
import { TEXT_LIMITS } from '../lib/limits';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstruation: '생리기',
  follicular: '난포기',
  ovulation: '배란기',
  luteal: '황체기',
};

type LogEntry = {
  id: string;
  title: string;
  timeLabel: string;
  variant: 'activity' | 'note';
  /** 캘린더 탭 Supabase 일정과 동기화된 항목(일기에서는 읽기 전용) */
  source?: 'diary' | 'calendar';
};

/** 일기 본문(note)만 로컬 보관. 일정(activity)은 캘린더 탭 scheduleEvents와만 동기화 */
const INITIAL_LOGS_BY_DATE: Record<string, LogEntry[]> = {
  '2026-04-09': [
    {
      id: '3',
      title: '나도 내 기분을 잘 모르겠음. 복통이 조금 있어서 일에 집중이 잘 안되었음. 복통이 아니라 허리가 끊어질 듯한 통증인 듯 싶기도?',
      timeLabel: '오후 1시 14분',
      variant: 'note',
      source: 'diary',
    },
  ],
};

function cloneLogsByDate(src: Record<string, LogEntry[]>): Record<string, LogEntry[]> {
  const out: Record<string, LogEntry[]> = {};
  for (const [k, arr] of Object.entries(src)) {
    out[k] = arr.map((e) => ({ ...e }));
  }
  return out;
}
const DIARY_VIEW_MODE_KEY = 'diary:viewMode';
const DIARY_LOGS_STORAGE_KEY = 'diary:logsByDate:v1';

function loadLogsByDateFromStorage(): Record<string, LogEntry[]> {
  if (typeof window === 'undefined') return cloneLogsByDate(INITIAL_LOGS_BY_DATE);
  try {
    const raw = window.localStorage.getItem(DIARY_LOGS_STORAGE_KEY);
    if (!raw) return cloneLogsByDate(INITIAL_LOGS_BY_DATE);
    const parsed = JSON.parse(raw) as Record<string, LogEntry[]>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return cloneLogsByDate(INITIAL_LOGS_BY_DATE);
    }
    return cloneLogsByDate(parsed);
  } catch {
    return cloneLogsByDate(INITIAL_LOGS_BY_DATE);
  }
}

function persistLogsByDateToStorage(logs: Record<string, LogEntry[]>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DIARY_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // ignore
  }
}

function getWeekDatesContaining(year: number, month: number, day: number): Date[] {
  const anchor = new Date(year, month, day);
  const sun = new Date(anchor);
  sun.setHours(0, 0, 0, 0);
  sun.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return d;
  });
}

export default function DiaryPage() {
  const navigate = useNavigate();
  const { periodRecords, scheduleEvents, reloadSchedules, remoteEnabled } = useCalendarData();
  const [viewMode, setViewMode] = useState<'week' | 'month'>(() => {
    const savedMode = localStorage.getItem(DIARY_VIEW_MODE_KEY);
    return savedMode === 'week' || savedMode === 'month' ? savedMode : 'month';
  });
  const [currentDate, setCurrentDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());
  const [diaryText, setDiaryText] = useState('');
  const [logsByDate, setLogsByDate] = useState<Record<string, LogEntry[]>>(() => loadLogsByDateFromStorage());
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [expandableActivityIds, setExpandableActivityIds] = useState<Set<string>>(new Set());
  const [activeModal, setActiveModal] = useState<'month' | 'deleteDiary' | null>(null);
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);
  const [tempMonthSelect, setTempMonthSelect] = useState<{ y: number; m: number } | null>(null);
  const activityTitleRefs = useRef<Record<string, HTMLParagraphElement | null>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysGrid = useMemo(() => getFullCalendarDays(year, month), [year, month]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const d = new Date(year, month - 12 + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      }),
    [year, month]
  );

  useEffect(() => {
    if (activeModal === 'month') {
      setTimeout(() => {
        const activeItem = document.querySelector('.modal-list-item.active');
        if (activeItem) activeItem.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 10);
    }
  }, [activeModal]);

  useEffect(() => {
    localStorage.setItem(DIARY_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    persistLogsByDateToStorage(logsByDate);
  }, [logsByDate]);

  /** 캘린더 탭에서 저장한 직후 일기로 올 때 최신 일정 반영 */
  useEffect(() => {
    if (!remoteEnabled) return;
    void reloadSchedules();
  }, [remoteEnabled, reloadSchedules]);

  const effectiveDay = selectedDay ?? 1;
  const weekDates = useMemo(
    () => getWeekDatesContaining(year, month, effectiveDay),
    [year, month, effectiveDay]
  );
  const selectedDateStr = formatDateString(year, month, effectiveDay);

  /** 오늘 이후 날짜는 일기 작성 비노출 (과거·오늘만 작성) */
  const canWriteDiaryForSelectedDay = useMemo(() => {
    const t = new Date();
    const todayStr = formatDateString(t.getFullYear(), t.getMonth(), t.getDate());
    return selectedDateStr <= todayStr;
  }, [selectedDateStr]);

  /** 일기 탭에서의 '일정' 행: 캘린더 탭 데이터만. 로컬 activity 목업은 사용하지 않음 */
  const dayLogsDiaryNotes = useMemo(
    () => (logsByDate[selectedDateStr] ?? []).filter((l) => l.variant === 'note'),
    [logsByDate, selectedDateStr]
  );

  const calendarLogsForDay = useMemo(
    () =>
      scheduleEvents
        .filter((e) => toCalendarDateString(e.date) === selectedDateStr)
        .map((e) => ({
          id: `calendar-${String(e.id)}`,
          title: e.title,
          timeLabel: formatDiaryScheduleTimeLabel(toCalendarDateString(e.date), e.time),
          variant: 'activity' as const,
          source: 'calendar' as const,
        })),
    [scheduleEvents, selectedDateStr]
  );

  const dayLogs = useMemo(
    () => [
      ...calendarLogsForDay,
      ...dayLogsDiaryNotes.map((l) => ({ ...l, source: l.source ?? ('diary' as const) })),
    ],
    [calendarLogsForDay, dayLogsDiaryNotes]
  );

  /** 월간 캘린더 점: 일기(note)가 있는 날만 표시 */
  const dotDates = useMemo(() => {
    const s = new Set<string>();
    for (const [d, logs] of Object.entries(logsByDate)) {
      if (logs.some((l) => l.variant === 'note')) s.add(d);
    }
    return s;
  }, [logsByDate]);

  useEffect(() => {
    setSelectedLogId(null);
    setEditingLogId(null);
    setEditDraft('');
    setPendingDeleteLogId(null);
    setActiveModal(null);
    setDiaryText('');
  }, [selectedDateStr]);

  useEffect(() => {
    const next = new Set<string>();
    dayLogs.forEach((log) => {
      if (log.variant !== 'activity') return;
      const el = activityTitleRefs.current[log.id];
      if (!el) return;
      const computedLineHeight = parseFloat(window.getComputedStyle(el).lineHeight || '0');
      if (!computedLineHeight) return;
      const maxSingleLineHeight = computedLineHeight + 1;
      if (el.scrollHeight > maxSingleLineHeight) {
        next.add(log.id);
      }
    });
    setExpandableActivityIds(next);
  }, [dayLogs, selectedDateStr]);

  const weekdayLabel = WEEKDAYS[new Date(year, month, effectiveDay).getDay()];

  const weekSelectedPhase = getCyclePhaseForCalendarDay(periodRecords, year, month, effectiveDay);

  /** 주간 배경: 해당 주 각 날의 주기 단계별 색 + 같은 단계 연속 구간 캡슐 연결 */
  const weekPhaseStrip = useMemo(() => {
    type Seg = 'single' | 'start' | 'mid' | 'end';
    const phases = weekDates.map((d) =>
      getCyclePhaseForCalendarDay(periodRecords, d.getFullYear(), d.getMonth(), d.getDate())
    );
    return phases.map((p, i): { phase: CyclePhase; seg: Seg } | null => {
      if (!p) return null;
      const prevSame = i > 0 && phases[i - 1] === p;
      const nextSame = i < 6 && phases[i + 1] === p;
      let seg: Seg;
      if (!prevSame && !nextSame) seg = 'single';
      else if (!prevSame && nextSame) seg = 'start';
      else if (prevSame && !nextSame) seg = 'end';
      else seg = 'mid';
      return { phase: p, seg };
    });
  }, [weekDates, periodRecords]);

  const handleSelectMonth = (y: number, m: number) => {
    setCurrentDate(new Date(y, m, 1));
    setSelectedDay(null);
    setActiveModal(null);
  };

  const handleWeekDateClick = (d: Date) => {
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(d.getDate());
  };

  const isSameDayAsSelection = (d: Date) =>
    selectedDay !== null &&
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === selectedDay;

  const formatDiaryDeletePrimary = (log: LogEntry) =>
    `${month + 1}월 ${effectiveDay}일 ${log.title}`;

  const handleSubmitDiaryWrite = () => {
    if (!canWriteDiaryForSelectedDay) return;
    const text = diaryText.trim();
    if (!text) {
      alert('내용을 입력해주세요.');
      return;
    }
    if (text.length > TEXT_LIMITS.DIARY_BODY) {
      alert(`일기 본문은 최대 ${TEXT_LIMITS.DIARY_BODY}자까지 입력할 수 있어요.`);
      return;
    }
    const now = new Date();
    /** 목록에 찍히는 날짜·시각: 선택한 일자 + 지금 시각(금일이 아닌 날을 고른 경우에도 해당 일자로 표시) */
    const stamped = new Date(year, month, effectiveDay, now.getHours(), now.getMinutes(), now.getSeconds());
    const timeLabel = stamped.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const dateKey = formatDateString(year, month, effectiveDay);
    const newEntry: LogEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `diary-${now.getTime()}`,
      title: text,
      timeLabel,
      variant: 'note',
      source: 'diary',
    };
    setLogsByDate((prev) => {
      const prevList = prev[dateKey] ?? [];
      return { ...prev, [dateKey]: [newEntry, ...prevList] };
    });
    setDiaryText('');
  };

  const handleConfirmDeleteDiary = () => {
    if (!pendingDeleteLogId) return;
    setLogsByDate((prev) => {
      const list = (prev[selectedDateStr] ?? []).filter((x) => x.id !== pendingDeleteLogId);
      const next = { ...prev };
      if (list.length === 0) delete next[selectedDateStr];
      else next[selectedDateStr] = list;
      return next;
    });
    setSelectedLogId(null);
    setEditingLogId(null);
    setEditDraft('');
    setPendingDeleteLogId(null);
    setActiveModal(null);
  };

  return (
    <div className={`diary-page${activeModal ? ' diary-page--modal-open' : ''}`}>
      <div
        className={`diary-top-block${viewMode === 'week' ? ' diary-top-block--week' : ''}`}
      >
        <div className="page-header">
          <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="뒤로">
            <ChevronLeft size={24} />
          </button>
          <h1 className="page-title">일기 및 기록</h1>
          <div style={{ width: 24 }} aria-hidden />
        </div>

        {/* 캘린더 탭과 동일 구조·스타일, 문구만 일기용 */}
        <div className="hero-banner">
          <div className="hero-text">
            <span className="hero-highlight">일상 기록을 남기면</span>
            <br />
            생활 팁을 조언해드려요
          </div>
          <img src={heroIcon} alt="3D Calendar Icon" className="hero-icon" />
        </div>

        <div className="diary-lang-toggle-wrap">
        <div className="lang-toggle" role="tablist" aria-label="보기 단위">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'week'}
            className={`lang-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            매주 단위
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'month'}
            className={`lang-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            매월 단위
          </button>
        </div>
        </div>

        <div className={`diary-calendar-card${viewMode === 'week' ? ' diary-calendar-card--week' : ''}`}>
        {viewMode === 'month' ? (
          <>
            <div className="diary-calendar-toolbar">
              <button type="button" className="month-selector" onClick={() => setActiveModal('month')}>
                {year}년 {month + 1}월 <ChevronDown size={20} color="#191F28" strokeWidth={2.5} />
              </button>
            </div>

            <div className="diary-calendar-grid diary-weekdays">
              {WEEKDAYS.map((d, idx) => (
                <div key={d} className={`diary-weekday ${idx === 0 ? 'is-sun' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="diary-calendar-grid">
              {daysGrid.map((dayObj, idx) => {
                const isSunday = idx % 7 === 0;
                const isSaturday = idx % 7 === 6;

                let cellYear = year;
                let cellMonth = month;
                if (dayObj.isPrevMonth) {
                  if (month === 0) {
                    cellYear -= 1;
                    cellMonth = 11;
                  } else {
                    cellMonth -= 1;
                  }
                } else if (dayObj.isNextMonth) {
                  if (month === 11) {
                    cellYear += 1;
                    cellMonth = 0;
                  } else {
                    cellMonth += 1;
                  }
                }

                const isCurrentMonth = !dayObj.isPrevMonth && !dayObj.isNextMonth;
                const cycle = getCyclePhaseForCalendarDay(periodRecords, cellYear, cellMonth, dayObj.day);
                const isSelected =
                  isCurrentMonth && selectedDay !== null && selectedDay === dayObj.day;
                const iterDateStr = formatDateString(cellYear, cellMonth, dayObj.day);
                const hasDot = dotDates.has(iterDateStr);

                let radiusClass = '';
                if (cycle) {
                  const prev = calendarAddDays(cellYear, cellMonth, dayObj.day, -1);
                  const next = calendarAddDays(cellYear, cellMonth, dayObj.day, 1);
                  const isStartOfPhase =
                    getCyclePhaseForCalendarDay(periodRecords, prev.y, prev.m0, prev.d) !== cycle;
                  const isEndOfPhase =
                    getCyclePhaseForCalendarDay(periodRecords, next.y, next.m0, next.d) !== cycle;
                  const roundLeft = isStartOfPhase || isSunday;
                  const roundRight = isEndOfPhase || isSaturday;
                  if (roundLeft && roundRight) radiusClass = 'radius-all';
                  else if (roundLeft) radiusClass = 'radius-left';
                  else if (roundRight) radiusClass = 'radius-right';
                  else radiusClass = 'radius-none';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`diary-day-cell ${dayObj.isPrevMonth || dayObj.isNextMonth ? 'is-dimmed' : ''} ${cycle ? `cycle-${cycle} ${radiusClass}` : ''} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      if (!dayObj.isPrevMonth && !dayObj.isNextMonth) {
                        setSelectedDay(dayObj.day);
                      }
                    }}
                    disabled={dayObj.isPrevMonth || dayObj.isNextMonth}
                  >
                    <span className={`diary-day-num ${isSunday ? 'is-sun' : ''}`}>{dayObj.day}</span>
                    {hasDot && (
                      <span className="diary-event-dot" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="calendar-legend-bar">
              <div className="legend-items">
                <span className="legend-item">
                  <div className="legend-color cycle-menstruation" /> 생리기
                </span>
                <span className="legend-item">
                  <div className="legend-color cycle-follicular" /> 난포기
                </span>
                <span className="legend-item">
                  <div className="legend-color cycle-ovulation" /> 배란기
                </span>
                <span className="legend-item">
                  <div className="legend-color cycle-luteal" /> 황체기
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="diary-week-view">
            {weekSelectedPhase ? (
              <div className="diary-week-current-phase" aria-label="현재 주기">
                <span className="legend-item">
                  <div className={`legend-color cycle-${weekSelectedPhase}`} />
                  {PHASE_LABELS[weekSelectedPhase]}
                </span>
              </div>
            ) : null}
            <div className="diary-week-strip-pill" role="list">
              <div className="diary-week-strip-pill-bg" aria-hidden>
                {weekPhaseStrip.map((cell, i) => (
                  <div key={i} className="diary-week-phase-slot">
                    {cell ? (
                      <div
                        className={`diary-week-phase-seg-inner diary-week-phase-seg-inner--${cell.phase} diary-week-phase-seg-inner--${cell.seg}`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="diary-week-strip-cols">
                {weekDates.map((d, i) => {
                  const str = formatDateString(d.getFullYear(), d.getMonth(), d.getDate());
                  const outside = d.getMonth() !== month || d.getFullYear() !== year;
                  const selected = isSameDayAsSelection(d);
                  return (
                    <button
                      key={str}
                      type="button"
                      role="listitem"
                      className={`diary-week-col${selected ? ' is-selected' : ''}${outside ? ' is-outside' : ''}`}
                      onClick={() => handleWeekDateClick(d)}
                    >
                      <span className="diary-week-col-dow">{WEEKDAYS[i]}</span>
                      <span className="diary-week-col-day">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      <section className="diary-log-section" aria-label="선택한 날의 기록">
        {dayLogs.length === 0 ? (
          <p className="diary-log-empty">이 날짜에 등록된 일정이 없어요.</p>
        ) : (
          dayLogs.map((log) => {
            const expanded = selectedLogId === log.id;
            const isEditing = editingLogId === log.id;
            const canExpand = log.variant === 'note' || expandableActivityIds.has(log.id);
            const showNoteFooter = expanded && log.variant === 'note' && log.source !== 'calendar';
            return (
              <article
                key={log.id}
                className={`diary-log-row diary-log-row--${log.variant}${expanded ? ' is-expanded' : ''}${canExpand ? ' is-clickable' : ''}`}
                onClick={() => {
                  if (editingLogId === log.id) return;
                  if (!canExpand) return;
                  setSelectedLogId((prev) => (prev === log.id ? null : log.id));
                  setEditingLogId(null);
                  setEditDraft('');
                }}
                aria-expanded={expanded}
              >
                <span className="diary-log-accent" aria-hidden />
                <div className={`diary-log-body${showNoteFooter ? ' diary-log-body--stacked-footer' : ''}`}>
                  {isEditing ? (
                    <div className="diary-textarea-wrap" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        className="diary-log-edit-textarea"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={5}
                        maxLength={TEXT_LIMITS.DIARY_BODY}
                      />
                      <span
                        className="diary-textarea-counter"
                        aria-live="polite"
                        aria-label={`${editDraft.length} / ${TEXT_LIMITS.DIARY_BODY}자`}
                      >
                        {editDraft.length} / {TEXT_LIMITS.DIARY_BODY}
                      </span>
                    </div>
                  ) : (
                    <p
                      ref={(el) => {
                        if (log.variant === 'activity') {
                          activityTitleRefs.current[log.id] = el;
                        }
                      }}
                      className="diary-log-title"
                    >
                      {log.title}
                    </p>
                  )}
                  {showNoteFooter ? (
                    <div className="diary-log-footer-row">
                      <p className="diary-log-time">{log.timeLabel}</p>
                      <div className="diary-log-expand-actions" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="diary-mini-btn diary-mini-btn--secondary"
                              onClick={() => {
                                setEditingLogId(null);
                                setEditDraft('');
                              }}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="diary-mini-btn diary-mini-btn--primary"
                              onClick={() => {
                                const next = editDraft.trim();
                                if (!next) {
                                  alert('내용을 입력해주세요.');
                                  return;
                                }
                                if (next.length > TEXT_LIMITS.DIARY_BODY) {
                                  alert(`일기 본문은 최대 ${TEXT_LIMITS.DIARY_BODY}자까지 입력할 수 있어요.`);
                                  return;
                                }
                                setLogsByDate((prev) => {
                                  const list = [...(prev[selectedDateStr] ?? [])];
                                  const i = list.findIndex((x) => x.id === log.id);
                                  if (i === -1) return prev;
                                  list[i] = { ...list[i], title: next };
                                  return { ...prev, [selectedDateStr]: list };
                                });
                                setEditingLogId(null);
                                setEditDraft('');
                              }}
                            >
                              저장
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="diary-mini-btn diary-mini-btn--secondary"
                              onClick={() => {
                                setEditingLogId(log.id);
                                setEditDraft(log.title);
                              }}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className="diary-mini-btn diary-mini-btn--secondary"
                              onClick={() => {
                                setPendingDeleteLogId(log.id);
                                setActiveModal('deleteDiary');
                              }}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="diary-log-time">{log.timeLabel}</p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {canWriteDiaryForSelectedDay ? (
        <section className="diary-write-section" aria-label="일기 작성">
          <h2 className="diary-write-heading">
            {month + 1}월 {effectiveDay}일 {weekdayLabel}요일 일기
          </h2>
          <div className="diary-write-box">
            <textarea
              className="diary-write-textarea"
              placeholder="기분, 통증, 증상 등 일상 내용을 자유롭게 기록하세요."
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              rows={4}
              maxLength={TEXT_LIMITS.DIARY_BODY}
            />
            <div className="diary-write-footer">
              <span
                className="diary-write-char-count"
                aria-live="polite"
                aria-label={`${diaryText.length} / ${TEXT_LIMITS.DIARY_BODY}자`}
              >
                {diaryText.length} / {TEXT_LIMITS.DIARY_BODY}
              </span>
              <div className="diary-write-actions">
                <button type="button" className="diary-mini-btn diary-mini-btn--secondary" onClick={() => setDiaryText('')}>
                  재작성
                </button>
                <button type="button" className="diary-mini-btn diary-mini-btn--secondary" onClick={handleSubmitDiaryWrite}>
                  작성 완료
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="diary-tips-section" aria-label="생활 팁 추천">
        <h2 className="diary-tips-heading">생활 팁 추천</h2>
        <div className="diary-tips-grid">
          <div className="diary-tip-card diary-tip-card--foods">
            <ul className="diary-tip-list">
              <li>🥩 소고기 (철분 보충)</li>
              <li>🥬 시금치 · 케일</li>
              <li>🍫 다크초콜릿 (마그네슘)</li>
            </ul>
          </div>
          <div className="diary-tip-card diary-tip-card--breath">
            <p>
              생리통이 있을 때 복식 호흡으로 통증을 줄일 수 있어요. 따뜻한 곳에서 편안하게 해보세요.
            </p>
          </div>
        </div>
        <div className="diary-tip-card diary-tip-card--wide">
          <p>
            지금은 몸이 쉬고 싶어하는 시기예요. 따뜻한 음료와 가벼운 식사로 컨디션을 관리해보세요. 무리하지 말고 오늘은 편안하게 보내요 💛
          </p>
        </div>
      </section>

      {activeModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setActiveModal(null);
            setPendingDeleteLogId(null);
          }}
        >
          {activeModal === 'month' && (
            <div className="list-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-scroll-area">
                {monthOptions.map((opt, i) => {
                  const isActive = tempMonthSelect
                    ? opt.year === tempMonthSelect.y && opt.month === tempMonthSelect.m
                    : opt.year === year && opt.month === month;
                  return (
                    <div
                      key={`${opt.year}-${opt.month}-${i}`}
                      className={`modal-list-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setTempMonthSelect({ y: opt.year, m: opt.month });
                        setTimeout(() => {
                          handleSelectMonth(opt.year, opt.month);
                          setTempMonthSelect(null);
                        }, 150);
                      }}
                    >
                      {opt.year}년 {opt.month + 1}월
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeModal === 'deleteDiary' &&
            pendingDeleteLogId &&
            (() => {
              const logToDelete = (logsByDate[selectedDateStr] ?? []).find((l) => l.id === pendingDeleteLogId);
              if (!logToDelete || logToDelete.variant !== 'note') return null;
              return (
                <div
                  className="form-modal figma-confirm-sheet diary-delete-confirm-sheet"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="figma-confirm-sheet-close"
                    onClick={() => {
                      setActiveModal(null);
                      setPendingDeleteLogId(null);
                    }}
                    aria-label="닫기"
                  >
                    <X size={22} color="#A3AAB2" strokeWidth={1.5} />
                  </button>
                  <div className="figma-confirm-sheet-body">
                    <p className="figma-confirm-sheet-primary">{formatDiaryDeletePrimary(logToDelete)}</p>
                    <p className="figma-confirm-sheet-secondary">일기를 삭제하시겠습니까?</p>
                  </div>
                  <div className="form-modal-actions figma-confirm-sheet-actions">
                    <button
                      type="button"
                      className="form-btn-cancel"
                      onClick={() => {
                        setActiveModal(null);
                        setPendingDeleteLogId(null);
                      }}
                    >
                      취소
                    </button>
                    <button type="button" className="form-btn-submit" onClick={handleConfirmDeleteDiary}>
                      일기 삭제
                    </button>
                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}
