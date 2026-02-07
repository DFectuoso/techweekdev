const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month]!;
}

export function getShortMonthName(month: number): string {
  return SHORT_MONTH_NAMES[month]!;
}

export function getDayName(day: number): string {
  return DAY_NAMES[day]!;
}

/** First day of a given month */
export function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Last day of a given month */
export function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

/** First day of the week (Monday) containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Last day of the week (Sunday) containing the given date */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Get all days in a month, padded so it starts on Monday */
export function getCalendarDays(
  year: number,
  month: number
): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday = 0, Sunday = 6
  const startPadding = firstDay === 0 ? 6 : firstDay - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }
  return days;
}

/** Format: YYYY-MM */
export function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Parse YYYY-MM to { year, month (0-indexed) } */
export function parseMonthParam(param: string): {
  year: number;
  month: number;
} {
  const [y, m] = param.split("-").map(Number);
  return { year: y!, month: m! - 1 };
}

/** Format: YYYY-MM-DD */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD to Date */
export function parseDateParam(param: string): Date {
  const [y, m, d] = param.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/** Format a date for display: "Mar 12" or "Mar 12, 2025" */
export function formatEventDate(date: Date, includeYear = false): string {
  const month = SHORT_MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  if (includeYear) {
    return `${month} ${day}, ${date.getFullYear()}`;
  }
  return `${month} ${day}`;
}

/** Format a date range */
export function formatDateRange(start: Date, end?: Date | null): string {
  if (!end || start.toDateString() === end.toDateString()) {
    return formatEventDate(start, true);
  }
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${getShortMonthName(start.getMonth())} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${formatEventDate(start)} - ${formatEventDate(end, true)}`;
}

/** Get the Monday of a given week row in a month grid */
export function getWeekStartForRow(
  year: number,
  month: number,
  dayInRow: number
): Date {
  const date = new Date(year, month, dayInRow);
  return getWeekStart(date);
}

/** Generate an array of Dates for a range of months */
export function generateDateRange(
  startYear: number,
  startMonth: number,
  months: number
): Date[] {
  const dates: Date[] = [];
  for (let m = 0; m < months; m++) {
    const totalMonth = startMonth + m;
    const year = startYear + Math.floor(totalMonth / 12);
    const month = totalMonth % 12;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(new Date(year, month, d));
    }
  }
  return dates;
}

/** Check if a date is in the past (before today) */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a date is the 1st of its month */
export function isFirstOfMonth(date: Date): boolean {
  return date.getDate() === 1;
}

/** Generate an ICS calendar file string for an event */
export function generateICS(event: {
  name: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  website?: string | null;
}): string {
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 3600000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TechWeek//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.name}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
  }
  if (event.website) {
    lines.push(`URL:${event.website}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
