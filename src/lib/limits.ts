/**
 * 입력 텍스트 길이 한도. 클라이언트 maxLength + DB CHECK 제약과 같이 사용합니다.
 * 변경 시 supabase/migrations 의 CHECK 제약도 함께 갱신해야 합니다.
 */
export const TEXT_LIMITS = {
  /** 일정 제목 (캘린더 일정 카드 1줄에 들어가는 분량) */
  SCHEDULE_TITLE: 80,
  /** 일정 시간 라벨 ("오전 9:00 - 오후 1:00" 수준) */
  SCHEDULE_TIME_LABEL: 30,
  /** 추천 사유 한 단락 분량 */
  SCHEDULE_REC_DESC: 300,
  /** 일기 본문 (A4 약 1장 분량) */
  DIARY_BODY: 2000,
} as const;
