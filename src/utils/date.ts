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
