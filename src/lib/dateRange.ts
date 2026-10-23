/** Inclusive YYYY-MM-DD range. */
export type DateRange = { startDate: string; endDate: string };

/** Today as YYYY-MM-DD (UTC, matching the API's dates). */
export const todayIso = () => new Date().toISOString().slice(0, 10);

// Calendar maths on YYYY-MM-DD strings, in UTC like the API's dates.
const DAY_MS = 24 * 60 * 60 * 1000;
const toTime = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`);
const fromTime = (time: number) => new Date(time).toISOString().slice(0, 10);

export const addDays = (isoDate: string, days: number) =>
  fromTime(toTime(isoDate) + days * DAY_MS);

/** First day of the month containing `isoDate`. */
export const startOfMonth = (isoDate: string) => `${isoDate.slice(0, 7)}-01`;

/** First day of the month `months` away from the month of `isoDate`. */
export function addMonths(isoDate: string, months: number) {
  const date = new Date(toTime(startOfMonth(isoDate)));
  date.setUTCMonth(date.getUTCMonth() + months);
  return fromTime(date.getTime());
}

/** The same day of the month `months` away, clamped to that month's length. */
export function shiftMonths(isoDate: string, months: number) {
  const target = addMonths(isoDate, months);
  const lastDay = addDays(addMonths(target, 1), -1);
  const day = isoDate.slice(8, 10);
  const candidate = `${target.slice(0, 8)}${day}`;
  return candidate > lastDay ? lastDay : candidate;
}

/** 0 = Monday ... 6 = Sunday. */
export const weekdayIndex = (isoDate: string) =>
  (new Date(toTime(isoDate)).getUTCDay() + 6) % 7;

/**
 * The month as weeks starting on Monday; days outside the month are null.
 */
export function calendarWeeks(month: string): (string | null)[][] {
  const first = startOfMonth(month);
  const next = addMonths(first, 1);
  const days: (string | null)[] = Array(weekdayIndex(first)).fill(null);
  for (let day = first; day < next; day = addDays(day, 1)) days.push(day);
  while (days.length % 7 !== 0) days.push(null);
  return Array.from({ length: days.length / 7 }, (_, week) =>
    days.slice(week * 7, week * 7 + 7),
  );
}
