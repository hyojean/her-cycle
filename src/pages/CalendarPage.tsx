import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronDown, CheckCircle2, Plus, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css';
import heroIcon from '../assets/calendar_hero_3d_icon.png';
import { getFullCalendarDays, formatDateString } from '../utils/date';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureSupabaseSession } from '../lib/supabaseAuth';
import {
  deleteSchedule,
  fetchSchedules,
  insertSchedule,
  scheduleRowToEvent,
  updateSchedule,
  type CalendarEventInput,
} from '../services/schedules';

type Event = {
  id: number | string;
  title: string;
  time: string;
  date: string;
  hasRec: boolean;
  oldTime?: string;
  recTime?: string;
  recDesc?: string;
};

// Initial realistic data reflecting mockups
const INITIAL_EVENTS: Event[] = [
  { 
    id: 1, 
    title: '새벽 등산 3km 왕복 러닝', 
    time: '04:00 - 05:00', 
    date: '2026-04-10',
    hasRec: true, 
    oldTime: '04:00 - 05:00', 
    recTime: '14:00 - 15:00', 
    recDesc: '현재 생리기 상태로 새벽 시간 격한 활동은 생체 리듬에 좋지 않아요. 낮 시간대로 변경하시길 추천드려요. 재택 중이시니 낮 시간대가 불가능하시다면, 새벽 보다는 저녁 시간대가 더 낫습니다.' 
  },
  { 
    id: 2, 
    title: '프로젝트 헤이밀리 영화 관람', 
    time: '21:00 - 23:00', 
    date: '2026-04-10',
    hasRec: true, 
    oldTime: '21:00 - 23:00', 
    recTime: '19:00 - 21:00', 
    recDesc: '현재 생리기 상태로 일찍 취침하는 것이 호르몬 안정에 큰 도움이 돼요. 변경이 가능하시다면 두 시간만 일찍 관람하는 건 어떠신가요?' 
  },
  { 
    id: 3, 
    title: 'Women In Vibe Coding 특강', 
    time: '18:00 - 19:00', 
    date: '2026-04-11',
    hasRec: false, 
    recDesc: '난포기에 진입하는 날이므로 특강 듣기 좋은 날씨와 시간대입니다. 다음 날 일정 3개가 몰려 있어 너무 무리하지는 마세요.' 
  },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type PeriodRecord = {
  start: string;
  end: string | null;
};

const getCycleForDate = (year: number, month: number, day: number, records: PeriodRecord[]) => {
  if (records.length === 0) return null;
  
  const tDate = new Date(year, month, day);
  
  const sorted = [...records].sort((a,b) => {
    const [ay, am, ad] = a.start.split('-').map(Number);
    const [by, bm, bd] = b.start.split('-').map(Number);
    return new Date(by, bm-1, bd).getTime() - new Date(ay, am-1, ad).getTime();
  });
  
  const latestLog = sorted.find(r => {
    const [ry, rm, rd] = r.start.split('-').map(Number);
    return new Date(ry, rm-1, rd) <= tDate;
  });
  
  if (!latestLog) return null; 

  const [sy, sm, sd] = latestLog.start.split('-').map(Number);
  const startDate = new Date(sy, sm-1, sd);
  
  const diffTime = tDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const cycleDay = diffDays % 28;

  if (latestLog.end) {
    const [ey, em, ed] = latestLog.end.split('-').map(Number);
    const endDate = new Date(ey, em-1, ed);
    if (tDate >= startDate && tDate <= endDate) return 'menstruation';
    if (diffDays >= 28 && cycleDay <= 4) return 'menstruation'; 
  } else {
    // 5 day average when no explicit end
    if (cycleDay >= 0 && cycleDay <= 4) return 'menstruation';
  }

  if (cycleDay >= 5 && cycleDay <= 10) return 'follicular'; 
  if (cycleDay >= 11 && cycleDay <= 17) return 'ovulation'; 
  if (cycleDay >= 18 && cycleDay <= 27) return 'luteal'; 
  return null;
};

function buildScheduleInput(
  partial: { title: string; date: string; time: string },
  existing?: Event
): CalendarEventInput {
  return {
    title: partial.title,
    date: partial.date,
    time: partial.time,
    hasRec: existing?.hasRec ?? false,
    oldTime: existing?.oldTime,
    recTime: existing?.recTime,
    recDesc: existing?.recDesc,
  };
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const remoteEnabled = isSupabaseConfigured();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(10);
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(false);
  const [events, setEvents] = useState<Event[]>(() => (remoteEnabled ? [] : INITIAL_EVENTS));
  const [periodRecords, setPeriodRecords] = useState<PeriodRecord[]>([
    { start: '2026-04-09', end: null } // The initial baseline mock
  ]);
  
  // Modal & Form States
  const [activeModal, setActiveModal] = useState<'month' | 'addOptions' | 'addEvent' | 'editEvent' | 'deleteEvent' | 'applyRecEvent' | 'startPeriod' | 'endPeriod' | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | string | null>(null);

  const [formDate, setFormDate] = useState('2026-04-10');
  const [formTimeStart, setFormTimeStart] = useState('');
  const [formTimeEnd, setFormTimeEnd] = useState('');
  const [formTitle, setFormTitle] = useState('');
  
  const [addOptionActive, setAddOptionActive] = useState<string>('생리 시작일 등록');
  const [tempMonthSelect, setTempMonthSelect] = useState<{y: number, m: number} | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleLinkGoogle = () => setIsGoogleLinked(prev => !prev);

  const daysGrid = useMemo(() => getFullCalendarDays(year, month), [year, month]);

  const monthOptions = Array.from({ length: 25 }, (_, i) => {
    const m = new Date(year, month - 12 + i, 1);
    return { year: m.getFullYear(), month: m.getMonth() };
  });

  useEffect(() => {
    if (activeModal === 'month') {
      setTimeout(() => {
        const activeItem = document.querySelector('.modal-list-item.active');
        if (activeItem) activeItem.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 10);
    }
  }, [activeModal]);

  const reloadSchedules = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !remoteEnabled) return;
    try {
      await ensureSupabaseSession(sb);
      const { data, error } = await fetchSchedules(sb);
      if (error) {
        console.error(error);
        return;
      }
      setEvents((data ?? []).map(scheduleRowToEvent));
    } catch (e) {
      console.error(e);
    }
  }, [remoteEnabled]);

  useEffect(() => {
    if (!remoteEnabled) return;
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      try {
        await ensureSupabaseSession(sb);
        const { data, error } = await fetchSchedules(sb);
        if (cancelled) return;
        if (error) {
          console.error(error);
          setEvents([]);
          return;
        }
        setEvents((data ?? []).map(scheduleRowToEvent));
      } catch (e) {
        console.error(e);
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [remoteEnabled]);

  const selectedDateStr = selectedDay ? formatDateString(year, month, selectedDay) : '';
  const isStartDate = periodRecords.some(r => r.start === selectedDateStr);
  const isEndDate = periodRecords.some(r => r.end === selectedDateStr);

  const selectedEvents = events.filter(e => {
    const defaultDate = new Date(); // Real system "Today"
    defaultDate.setHours(0,0,0,0);
    
    // Fallback appropriately: If viewing current month and no day selected, fallback to Today.
    // If viewing another month without selection, fallback to 1st of that month.
    let baseDate: Date;
    if (selectedDay) {
      baseDate = new Date(year, month, selectedDay);
    } else {
      if (year === defaultDate.getFullYear() && month === defaultDate.getMonth()) {
        baseDate = defaultDate;
      } else {
        baseDate = new Date(year, month, 1);
      }
    }
    
    const [eY, eM, eD] = e.date.split('-').map(Number);
    const eDate = new Date(eY, eM - 1, eD);
    
    const diffTime = eDate.getTime() - baseDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 3;
  }).sort((a, b) => {
    const [aY, aM, aD] = a.date.split('-').map(Number);
    const [bY, bM, bD] = b.date.split('-').map(Number);
    return new Date(aY, aM - 1, aD).getTime() - new Date(bY, bM - 1, bD).getTime();
  });
  
  const dotDates = events.map(e => e.date);

  // Handlers
  const handleSelectMonth = (y: number, m: number) => {
    setCurrentDate(new Date(y, m, 1));
    setSelectedDay(null);
    setActiveModal(null);
  };

  const openAddEvent = () => {
    setFormDate(selectedDateStr || formatDateString(year, month, selectedDay || 1));
    setFormTimeStart('');
    setFormTimeEnd('');
    setFormTitle('');
    setActiveModal('addEvent');
  };

  const openEditEvent = (evt: Event) => {
    setEditingEventId(evt.id);
    setFormDate(evt.date);
    
    if (evt.time && evt.time !== '종일') {
      const [start, end] = evt.time.split(' - ');
      setFormTimeStart(start?.trim() || '');
      setFormTimeEnd(end?.trim() || '');
    } else {
      setFormTimeStart('');
      setFormTimeEnd('');
    }
    
    setFormTitle(evt.title);
    setActiveModal('editEvent');
  };

  const openApplyRec = (evt: Event) => {
    setEditingEventId(evt.id);
    setActiveModal('applyRecEvent');
  };

  const handleApplyRecEvent = async () => {
    const evt = events.find((e) => e.id === editingEventId);
    if (!evt?.recTime) {
      setActiveModal(null);
      return;
    }

    const sb = getSupabase();
    if (sb && remoteEnabled) {
      try {
        await ensureSupabaseSession(sb);
        const { error } = await updateSchedule(sb, Number(evt.id), {
          title: evt.title,
          date: evt.date,
          time: evt.recTime,
          hasRec: false,
          oldTime: evt.oldTime,
          recTime: evt.recTime,
          recDesc: evt.recDesc,
        });
        if (error) throw error;
        await reloadSchedules();
        setActiveModal(null);
      } catch (e) {
        alert(e instanceof Error ? e.message : '추천 일정을 적용하지 못했습니다.');
      }
      return;
    }

    setEvents(
      events.map((e) => (e.id === editingEventId && e.recTime ? { ...e, time: e.recTime, hasRec: false } : e))
    );
    setActiveModal(null);
  };

  const handleStartPeriodConfirm = () => {
    const reqDate = selectedDateStr || formatDateString(year, month, selectedDay || 1);
    const existingIndex = periodRecords.findIndex(r => r.start === reqDate);
    
    if (existingIndex >= 0) {
      const updated = [...periodRecords];
      updated.splice(existingIndex, 1);
      setPeriodRecords(updated);
    } else {
      setPeriodRecords([...periodRecords, { start: reqDate, end: null }]);
    }
    setActiveModal(null);
  };

  const handleEndPeriodConfirm = () => {
    const reqDate = selectedDateStr || formatDateString(year, month, selectedDay || 1);
    
    const existingLogIndex = periodRecords.findIndex(r => r.end === reqDate);
    if (existingLogIndex >= 0) {
      const updated = [...periodRecords];
      updated[existingLogIndex] = { ...updated[existingLogIndex], end: null };
      setPeriodRecords(updated);
    } else {
      const sorted = [...periodRecords].sort((a,b) => {
        const [ay, am, ad] = a.start.split('-').map(Number);
        const [by, bm, bd] = b.start.split('-').map(Number);
        return new Date(by, bm-1, bd).getTime() - new Date(ay, am-1, ad).getTime();
      });
      
      const reqDateObj = (() => { const [y,m,d] = reqDate.split('-').map(Number); return new Date(y, m-1, d); })();
      const latestLog = sorted.find(r => {
        const [ry, rm, rd] = r.start.split('-').map(Number);
        return new Date(ry, rm-1, rd) <= reqDateObj;
      });
      
      if (latestLog) {
        setPeriodRecords(periodRecords.map(r => r.start === latestLog.start ? { ...r, end: reqDate } : r));
      } else {
        alert("기준 내에 시작일을 먼저 등록해주세요.");
      }
    }
    setActiveModal(null);
  };

  const handleSubmitEvent = async () => {
    if (!formTitle.trim()) {
      alert('일정 내용을 입력해주세요.');
      return;
    }

    const finalTime = formTimeStart && formTimeEnd ? `${formTimeStart} - ${formTimeEnd}` : '종일';
    const existing = activeModal === 'editEvent' ? events.find((e) => e.id === editingEventId) : undefined;
    const input = buildScheduleInput({ title: formTitle.trim(), date: formDate, time: finalTime }, existing);

    const sb = getSupabase();
    if (sb && remoteEnabled) {
      try {
        await ensureSupabaseSession(sb);
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) throw new Error('로그인 세션이 없습니다.');

        if (activeModal === 'addEvent') {
          const { error } = await insertSchedule(sb, user.id, input);
          if (error) throw error;
        } else if (activeModal === 'editEvent' && editingEventId != null) {
          const idNum = Number(editingEventId);
          if (!Number.isFinite(idNum)) throw new Error('잘못된 일정입니다.');
          const { error } = await updateSchedule(sb, idNum, input);
          if (error) throw error;
        }
        await reloadSchedules();
        setActiveModal(null);
      } catch (e) {
        alert(e instanceof Error ? e.message : '일정을 저장하지 못했습니다.');
      }
      return;
    }

    if (activeModal === 'addEvent') {
      const newEvent: Event = {
        id: Date.now(),
        title: formTitle.trim(),
        time: finalTime,
        date: formDate,
        hasRec: false,
      };
      setEvents([...events, newEvent]);
    } else if (activeModal === 'editEvent' && editingEventId) {
      setEvents(
        events.map((e) => (e.id === editingEventId ? { ...e, title: formTitle.trim(), time: finalTime, date: formDate } : e))
      );
    }
    setActiveModal(null);
  };

  const handleDeleteEvent = async () => {
    if (editingEventId == null) {
      setActiveModal(null);
      return;
    }

    const sb = getSupabase();
    if (sb && remoteEnabled) {
      try {
        await ensureSupabaseSession(sb);
        const idNum = Number(editingEventId);
        if (!Number.isFinite(idNum)) throw new Error('잘못된 일정입니다.');
        const { error } = await deleteSchedule(sb, idNum);
        if (error) throw error;
        await reloadSchedules();
        setActiveModal(null);
      } catch (e) {
        alert(e instanceof Error ? e.message : '일정을 삭제하지 못했습니다.');
      }
      return;
    }

    setEvents(events.filter((e) => e.id !== editingEventId));
    setActiveModal(null);
  };

  // Safe parsing formDate for the edit UI label
  const displayFormDateObj = formDate ? formDate.split('-').map(Number) : [year, month + 1, selectedDay || 1];
  const formDateLabel = `${displayFormDateObj[0]}년 ${displayFormDateObj[1]}월 ${displayFormDateObj[2]}일`;

  const formatEventSummaryLine = (evt: Event) => {
    const [, m, d] = evt.date.split('-').map(Number);
    return `${m}월 ${d}일 ${evt.title}`;
  };

  const formatTimeRangeForModal = (timeRange: string) =>
    timeRange.replace(/\s*-\s*/g, '~').replace('종일', '종일');

  return (
    <div className={`calendar-page ${activeModal ? 'no-scroll' : ''}`}>
      {/* Header */}
      <div className="page-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">월별 스케줄 관리</h1>
        <div style={{ width: 24 }} />
      </div>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <span className="hero-highlight">생체 주기 기반으로</span><br />
          일정 배치를 추천드려요
        </div>
        <img src={heroIcon} alt="3D Calendar Icon" className="hero-icon" />
      </div>

      {/* Calendar Card */}
      <div className="calendar-card">
        <div className="calendar-header">
          <button className="month-selector" onClick={() => setActiveModal('month')}>
            {year}년 {month + 1}월 <ChevronDown size={20} color="#191F28" strokeWidth={2.5} />
          </button>
          <button className="google-cal-badge" onClick={handleLinkGoogle}>
            {isGoogleLinked ? '구글 캘린더 연동 해제' : '구글 캘린더 연동'}
            <CheckCircle2 size={13} color={isGoogleLinked ? "#FF8BA7" : "#FFFFFF"} strokeWidth={2.5} />
          </button>
        </div>

        <div className="calendar-grid weekdays">
          {WEEKDAYS.map((day, idx) => (
            <div key={day} className={`weekday ${idx === 0 ? 'sunday' : ''}`}>{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {daysGrid.map((dayObj, idx) => {
            const isSunday = idx % 7 === 0;
            const isSaturday = idx % 7 === 6;
            
            let cellYear = year;
            let cellMonth = month;
            if (dayObj.isPrevMonth) {
              if (month === 0) { cellYear -= 1; cellMonth = 11; } else { cellMonth -= 1; }
            } else if (dayObj.isNextMonth) {
              if (month === 11) { cellYear += 1; cellMonth = 0; } else { cellMonth += 1; }
            }

            const cycle = getCycleForDate(cellYear, cellMonth, dayObj.day, periodRecords);
            const isSelected = selectedDay === dayObj.day && !dayObj.isPrevMonth && !dayObj.isNextMonth;
            
            const iterDateStr = formatDateString(cellYear, cellMonth, dayObj.day);
            const hasDot = dotDates.includes(iterDateStr); 

            let radiusClass = '';
            if (cycle) {
              const isStartOfPhase = getCycleForDate(cellYear, cellMonth, dayObj.day - 1, periodRecords) !== cycle;
              const isEndOfPhase = getCycleForDate(cellYear, cellMonth, dayObj.day + 1, periodRecords) !== cycle;
              
              const roundLeft = isStartOfPhase || isSunday;
              const roundRight = isEndOfPhase || isSaturday;

              if (roundLeft && roundRight) radiusClass = 'radius-all';
              else if (roundLeft) radiusClass = 'radius-left';
              else if (roundRight) radiusClass = 'radius-right';
              else radiusClass = 'radius-none';
            }

            return (
              <div 
                key={idx} 
                className={`day-cell ${dayObj.isPrevMonth || dayObj.isNextMonth ? 'dimmed' : ''} ${cycle ? `cycle-${cycle} ${radiusClass}` : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (!dayObj.isPrevMonth && !dayObj.isNextMonth) {
                    setSelectedDay(dayObj.day);
                  }
                }}
              >
                <div className={`day-number ${isSunday ? 'sunday' : ''}`}>{dayObj.day}</div>
                {hasDot && (
                  <div className="event-dots">
                    <div className="dot dot-default" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="calendar-legend-bar">
          <div className="legend-items">
            <span className="legend-item"><div className="legend-color cycle-menstruation" /> 생리기</span>
            <span className="legend-item"><div className="legend-color cycle-follicular" /> 난포기</span>
            <span className="legend-item"><div className="legend-color cycle-ovulation" /> 배란기</span>
            <span className="legend-item"><div className="legend-color cycle-luteal" /> 황체기</span>
          </div>
          <button className="add-event-btn" onClick={() => { setAddOptionActive(''); setActiveModal('addOptions'); }}><Plus size={16} strokeWidth={3} /></button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="schedule-list-container">
        {selectedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8B95A1', padding: '20px 0', fontSize: '14px' }}>
            등록된 스케줄이 없습니다.
          </div>
        ) : (
          selectedEvents.map(event => {
            const [, eMonth, eDay] = event.date.split('-');
            const displayTitle = `${parseInt(eMonth)}월 ${parseInt(eDay)}일 ${event.title}`;

            return (
              <div key={event.id} className="schedule-item">
                <div className="schedule-item-header">
                  <span className="schedule-title">{displayTitle}</span>
                  <span className="schedule-time-meta">{event.time}</span>
                </div>

                {event.hasRec ? (
                  <div className="recommendation-box">
                    <div className="rec-header">
                      <span className="rec-title">추천 스케줄 시간</span>
                      <button className="rec-apply-btn" onClick={() => openApplyRec(event)}>일정 적용 <ChevronRight size={14} /></button>
                    </div>
                    <div className="rec-time-flow">
                      <span className="time-pill old">{event.oldTime}</span>
                      <span className="rec-arrow">→</span>
                      <span className="time-pill new">{event.recTime}</span>
                    </div>
                    <p className="rec-desc">
                      {event.recDesc}
                    </p>
                  </div>
                ) : (
                  <p className="rec-desc no-box">
                    {event.recDesc}
                  </p>
                )}

                <div className="schedule-actions">
                  <button className="action-btn" onClick={() => openEditEvent(event)}>일정 수정</button>
                  <button className="action-btn" onClick={() => {
                    setEditingEventId(event.id);
                    setActiveModal('deleteEvent');
                  }}>일정 삭제</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals Overlay */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          
          {/* Month Selector Modal */}
          {activeModal === 'month' && (
            <div className="list-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-scroll-area">
                {monthOptions.map((opt, i) => {
                  const isActive = tempMonthSelect ? (opt.year === tempMonthSelect.y && opt.month === tempMonthSelect.m) : (opt.year === year && opt.month === month);
                  return (
                    <div 
                      key={i} 
                      className={`modal-list-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setTempMonthSelect({y: opt.year, m: opt.month});
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

          {/* Add Event Options Modal */}
          {activeModal === 'addOptions' && (
            <div className="list-modal" onClick={e => e.stopPropagation()}>
              <div 
                className={`modal-list-item ${addOptionActive === '일정 등록' ? 'active' : ''}`} 
                onClick={() => { setAddOptionActive('일정 등록'); setTimeout(openAddEvent, 150); }}
              >일정 등록</div>
              <div 
                className={`modal-list-item ${addOptionActive === '생리 시작일 옵션' ? 'active' : ''}`} 
                onClick={() => { setAddOptionActive('생리 시작일 옵션'); setTimeout(() => { setActiveModal('startPeriod'); }, 150); }}
              >{isStartDate ? '생리 시작일 삭제' : '생리 시작일 등록'}</div>
              <div 
                className={`modal-list-item ${addOptionActive === '생리 종료일 옵션' ? 'active' : ''}`} 
                onClick={() => { setAddOptionActive('생리 종료일 옵션'); setTimeout(() => { setActiveModal('endPeriod'); }, 150); }}
              >{isEndDate ? '생리 종료일 삭제' : '생리 종료일 등록'}</div>
            </div>
          )}

          {/* Form Modal: Add & Edit Event */}
          {(activeModal === 'addEvent' || activeModal === 'editEvent') && (
            <div className="form-modal" onClick={e => e.stopPropagation()}>
              <div className="form-modal-header">
                <h2 className="form-modal-title">{activeModal === 'addEvent' ? '일정 등록' : '일정 수정'}</h2>
                <button className="form-modal-close" onClick={() => setActiveModal(null)}>
                  <X size={24} color="#A3AAB2" strokeWidth={1.5} />
                </button>
              </div>

              <div className="form-modal-body">
                {/* Date Selection */}
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    className="form-input-styled hollow-input" 
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    style={{ color: 'transparent', cursor: 'pointer' }}
                  />
                  <div style={{ position: 'absolute', top: 18, left: 20, pointerEvents: 'none', color: '#8B95A1', fontSize: '15px' }}>
                    {activeModal === 'editEvent' ? formDateLabel : (formDate ? `${formDate.split('-')[0]}년 ${formDate.split('-')[1]}월 ${formDate.split('-')[2]}일` : '날짜 선택')}
                  </div>
                  <ChevronDown size={20} color="#8B95A1" style={{ position: 'absolute', right: 20, top: 18, pointerEvents: 'none' }} />
                </div>

                {/* Time Selection */}
                <div className="form-input-styled" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', gap: '8px', position: 'relative' }}>
                  
                  {/* Start Time Wrapper */}
                  <div style={{ position: 'relative', flex: 1, height: '24px' }}>
                    <input 
                      type="time" 
                      className="hollow-input"
                      value={formTimeStart}
                      onChange={e => setFormTimeStart(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', color: formTimeStart ? '#8B95A1' : 'transparent', fontSize: '15px', width: '100%', height: '100%', textAlign: 'left', cursor: 'pointer', zIndex: 1, position: 'relative' }}
                    />
                    {!formTimeStart && <span style={{ position: 'absolute', left: 0, top: 2, color: '#8B95A1', fontSize: '15px', pointerEvents: 'none' }}>시작 시간 선택</span>}
                    <ChevronDown size={18} color="#8B95A1" style={{ position: 'absolute', right: 0, top: 3, pointerEvents: 'none' }} />
                  </div>

                  <span style={{ color: '#8B95A1', fontWeight: 500, margin: '0 4px' }}>~</span>
                  
                  {/* End Time Wrapper */}
                  <div style={{ position: 'relative', flex: 1, height: '24px' }}>
                    <input 
                      type="time" 
                      className="hollow-input"
                      value={formTimeEnd}
                      onChange={e => setFormTimeEnd(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', color: formTimeEnd ? '#8B95A1' : 'transparent', fontSize: '15px', width: '100%', height: '100%', textAlign: 'left', cursor: 'pointer', zIndex: 1, position: 'relative' }}
                    />
                    {!formTimeEnd && <span style={{ position: 'absolute', left: 0, top: 2, color: '#8B95A1', fontSize: '15px', pointerEvents: 'none' }}>종료 시간 선택</span>}
                    <ChevronDown size={18} color="#8B95A1" style={{ position: 'absolute', right: 0, top: 3, pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* Content */}
                <textarea 
                  className="form-textarea"
                  placeholder="내용을 작성하세요."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-modal-actions">
                <button className="form-btn-cancel" onClick={() => setActiveModal(null)}>취소</button>
                <button className="form-btn-submit" onClick={handleSubmitEvent}>
                  {activeModal === 'addEvent' ? '스케줄 작성 완료' : '스케줄 수정 완료'}
                </button>
              </div>
            </div>
          )}

          {/* Form Modal: Delete Confirm (Figma 캘린더_선택_선택-4) */}
          {activeModal === 'deleteEvent' && (() => {
            const evt = events.find((e) => e.id === editingEventId);
            if (!evt) return null;
            return (
              <div className="form-modal figma-confirm-sheet" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="figma-confirm-sheet-close"
                  onClick={() => setActiveModal(null)}
                  aria-label="닫기"
                >
                  <X size={22} color="#A3AAB2" strokeWidth={1.5} />
                </button>
                <div className="figma-confirm-sheet-body">
                  <p className="figma-confirm-sheet-primary">{formatEventSummaryLine(evt)}</p>
                  <p className="figma-confirm-sheet-secondary">일정을 삭제하시겠습니까?</p>
                </div>
                <div className="form-modal-actions figma-confirm-sheet-actions">
                  <button type="button" className="form-btn-cancel" onClick={() => setActiveModal(null)}>
                    취소
                  </button>
                  <button type="button" className="form-btn-submit" onClick={handleDeleteEvent}>
                    스케줄 삭제
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Form Modal: Apply Rec Event (Figma 캘린더_선택_선택-10) */}
          {activeModal === 'applyRecEvent' && (() => {
            const evt = events.find((e) => e.id === editingEventId);
            if (!evt) return null;
            const oldDisplay = evt.oldTime
              ? formatTimeRangeForModal(evt.oldTime)
              : formatTimeRangeForModal(evt.time);
            const newDisplay = evt.recTime ? formatTimeRangeForModal(evt.recTime) : '';
            return (
              <div className="form-modal figma-confirm-sheet" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="figma-confirm-sheet-close"
                  onClick={() => setActiveModal(null)}
                  aria-label="닫기"
                >
                  <X size={22} color="#A3AAB2" strokeWidth={1.5} />
                </button>
                <div className="figma-confirm-sheet-body">
                  <p className="figma-confirm-sheet-primary">{formatEventSummaryLine(evt)}</p>
                  <p className="figma-confirm-sheet-time-row">
                    <span className="figma-confirm-time-muted">{oldDisplay}</span>
                    <span className="figma-confirm-time-arrow">→</span>
                    <span className="figma-confirm-time-accent">{newDisplay}</span>
                  </p>
                  <p className="figma-confirm-sheet-secondary">추천 일정을 적용하시겠습니까?</p>
                </div>
                <div className="form-modal-actions figma-confirm-sheet-actions">
                  <button type="button" className="form-btn-cancel" onClick={() => setActiveModal(null)}>
                    취소
                  </button>
                  <button type="button" className="form-btn-submit" onClick={handleApplyRecEvent}>
                    스케줄 적용
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Form Modal: Start Period */}
          {activeModal === 'startPeriod' && (
            <div className="form-modal confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="confirm-header">
                <div></div>
                <h2 className="confirm-title">{month + 1}월 {selectedDay || 1}일 시작일을 {isStartDate ? '삭제' : '등록'}하시겠습니까?</h2>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <button className="form-modal-close" onClick={() => setActiveModal(null)} style={{ position: 'relative' }}>
                    <X size={28} color="#A3AAB2" strokeWidth={1} style={{marginRight: '-4px'}} />
                  </button>
                </div>
              </div>

              <div className="form-modal-actions">
                <button className="form-btn-cancel" onClick={() => setActiveModal(null)}>취소</button>
                <button className="form-btn-submit" onClick={handleStartPeriodConfirm}>{isStartDate ? '삭제 확인' : '생리 시작일 등록'}</button>
              </div>
            </div>
          )}

          {/* Form Modal: End Period */}
          {activeModal === 'endPeriod' && (
            <div className="form-modal confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="confirm-header">
                <div></div>
                <h2 className="confirm-title">{month + 1}월 {selectedDay || 1}일 종료일을 {isEndDate ? '삭제' : '등록'}하시겠습니까?</h2>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <button className="form-modal-close" onClick={() => setActiveModal(null)} style={{ position: 'relative' }}>
                    <X size={28} color="#A3AAB2" strokeWidth={1} style={{marginRight: '-4px'}} />
                  </button>
                </div>
              </div>

              <div className="form-modal-actions">
                <button className="form-btn-cancel" onClick={() => setActiveModal(null)}>취소</button>
                <button className="form-btn-submit" onClick={handleEndPeriodConfirm}>{isEndDate ? '삭제 확인' : '생리 종료일 등록'}</button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
