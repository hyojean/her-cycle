import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureSupabaseSession } from '../lib/supabaseAuth';
import { fetchSchedules, scheduleRowToEvent } from '../services/schedules';
import {
  loadPeriodRecordsFromStorage,
  persistPeriodRecordsToStorage,
  PERIOD_RECORDS_STORAGE_KEY,
  type PeriodRecord,
} from '../utils/cycleCalendar';
import { formatDateString } from '../utils/date';

export type CalendarScheduleEvent = {
  id: number | string;
  title: string;
  time: string;
  date: string;
  hasRec: boolean;
  oldTime?: string;
  recTime?: string;
  recDesc?: string;
};

function buildMockScheduleEvents(): CalendarScheduleEvent[] {
  const t = new Date();
  const y = t.getFullYear();
  const m = t.getMonth();
  const d = t.getDate();
  const today = formatDateString(y, m, d);
  const tNext = new Date(y, m, d + 1);
  const tomorrow = formatDateString(tNext.getFullYear(), tNext.getMonth(), tNext.getDate());
  return [
    {
      id: 1,
      title: '새벽 등산 3km 왕복 러닝',
      time: '04:00 - 05:00',
      date: today,
      hasRec: true,
      oldTime: '04:00 - 05:00',
      recTime: '14:00 - 15:00',
      recDesc:
        '현재 생리기 상태로 새벽 시간 격한 활동은 생체 리듬에 좋지 않아요. 낮 시간대로 변경하시길 추천드려요.',
    },
    {
      id: 2,
      title: '프로젝트 헤이밀리 영화 관람',
      time: '21:00 - 23:00',
      date: today,
      hasRec: true,
      oldTime: '21:00 - 23:00',
      recTime: '19:00 - 21:00',
      recDesc:
        '현재 생리기 상태로 일찍 취침하는 것이 호르몬 안정에 큰 도움이 돼요.',
    },
    {
      id: 3,
      title: 'Women In Vibe Coding 특강',
      time: '18:00 - 19:00',
      date: tomorrow,
      hasRec: false,
      recDesc:
        '난포기에 진입하는 날이므로 특강 듣기 좋은 날씨와 시간대입니다.',
    },
  ];
}

export type ScheduleRemoteStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready' }
  | { state: 'error'; message: string };

type CalendarDataContextValue = {
  periodRecords: PeriodRecord[];
  setPeriodRecords: React.Dispatch<React.SetStateAction<PeriodRecord[]>>;
  scheduleEvents: CalendarScheduleEvent[];
  setScheduleEvents: React.Dispatch<React.SetStateAction<CalendarScheduleEvent[]>>;
  reloadSchedules: () => Promise<void>;
  remoteEnabled: boolean;
  remoteScheduleStatus: ScheduleRemoteStatus;
};

const CalendarDataContext = createContext<CalendarDataContextValue | null>(null);

export function CalendarDataProvider({ children }: { children: ReactNode }) {
  const remoteEnabled = isSupabaseConfigured();
  const [periodRecords, setPeriodRecords] = useState<PeriodRecord[]>(() =>
    loadPeriodRecordsFromStorage()
  );
  const [scheduleEvents, setScheduleEvents] = useState<CalendarScheduleEvent[]>(() =>
    remoteEnabled ? [] : buildMockScheduleEvents()
  );
  const [remoteScheduleStatus, setRemoteScheduleStatus] = useState<ScheduleRemoteStatus>({
    state: 'idle',
  });

  useEffect(() => {
    persistPeriodRecordsToStorage(periodRecords);
  }, [periodRecords]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PERIOD_RECORDS_STORAGE_KEY) {
        setPeriodRecords(loadPeriodRecordsFromStorage());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
      setScheduleEvents((data ?? []).map(scheduleRowToEvent));
    } catch (err) {
      console.error(err);
    }
  }, [remoteEnabled]);

  useEffect(() => {
    if (!remoteEnabled) return;
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      setRemoteScheduleStatus({ state: 'loading' });
      try {
        await ensureSupabaseSession(sb);
        const { data, error } = await fetchSchedules(sb);
        if (cancelled) return;
        if (error) {
          console.error(error);
          setRemoteScheduleStatus({ state: 'error', message: error.message });
          setScheduleEvents([]);
          return;
        }
        setScheduleEvents((data ?? []).map(scheduleRowToEvent));
        setRemoteScheduleStatus({ state: 'ready' });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setScheduleEvents([]);
          setRemoteScheduleStatus({
            state: 'error',
            message: e instanceof Error ? e.message : '일정을 불러오지 못했습니다.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [remoteEnabled]);

  const value = useMemo(
    () => ({
      periodRecords,
      setPeriodRecords,
      scheduleEvents,
      setScheduleEvents,
      reloadSchedules,
      remoteEnabled,
      remoteScheduleStatus,
    }),
    [
      periodRecords,
      scheduleEvents,
      reloadSchedules,
      remoteEnabled,
      remoteScheduleStatus,
    ]
  );

  return <CalendarDataContext.Provider value={value}>{children}</CalendarDataContext.Provider>;
}

export function useCalendarData(): CalendarDataContextValue {
  const ctx = useContext(CalendarDataContext);
  if (!ctx) throw new Error('useCalendarData는 CalendarDataProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
