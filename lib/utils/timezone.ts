export const BAY_AREA_TIMEZONE = "America/Los_Angeles";

const EXPLICIT_TZ_REGEX = /(Z|[+-]\d{2}:\d{2})$/i;
const NAIVE_ISO_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/;

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parseNaiveIsoParts(input: string): DateParts | null {
  const match = input.match(NAIVE_ISO_REGEX);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
  };
}

function partsToUtcMs(parts: DateParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
}

function formatInTimezoneParts(utcMs: number, timezone: string): DateParts | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(new Date(utcMs));
    const get = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");

    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hour: get("hour"),
      minute: get("minute"),
      second: get("second"),
    };
  } catch {
    return null;
  }
}

function zonedNaiveToDate(naiveIso: string, timezone: string): Date | null {
  const target = parseNaiveIsoParts(naiveIso);
  if (!target) return null;

  let guess = partsToUtcMs(target);
  for (let i = 0; i < 4; i++) {
    const zoned = formatInTimezoneParts(guess, timezone);
    if (!zoned) return null;
    const diffMs = partsToUtcMs(target) - partsToUtcMs(zoned);
    if (diffMs === 0) break;
    guess += diffMs;
  }

  const date = new Date(guess);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseDateTimeInTimezone(
  value: string,
  timezone: string
): Date | null {
  const input = value.trim();
  if (!input) return null;

  if (EXPLICIT_TZ_REGEX.test(input)) {
    return toDate(input);
  }

  const zoned = zonedNaiveToDate(input, timezone);
  if (zoned) return zoned;

  return toDate(input);
}

export function parseDateTimeInBayArea(value: string): Date | null {
  return parseDateTimeInTimezone(value, BAY_AREA_TIMEZONE);
}

export function toIsoInTimezone(
  value: string,
  timezone: string
): string | null {
  const date = parseDateTimeInTimezone(value, timezone);
  return date ? date.toISOString() : null;
}

export function toIsoInBayArea(value: string): string | null {
  return toIsoInTimezone(value, BAY_AREA_TIMEZONE);
}

export function formatDatetimeLocalInTimezone(
  value: string | number | Date,
  timezone: string
): string {
  const date =
    typeof value === "string"
      ? parseDateTimeInTimezone(value, timezone)
      : toDate(value);
  if (!date) return "";

  const parts = formatInTimezoneParts(date.getTime(), timezone);
  if (!parts) return "";

  const y = String(parts.year).padStart(4, "0");
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  const h = String(parts.hour).padStart(2, "0");
  const min = String(parts.minute).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function formatDatetimeLocalInBayArea(
  value: string | number | Date
): string {
  return formatDatetimeLocalInTimezone(value, BAY_AREA_TIMEZONE);
}

export function formatDateInBayArea(
  value: string | number | Date,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const date =
    typeof value === "string"
      ? parseDateTimeInBayArea(value)
      : toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat(locale, {
    timeZone: BAY_AREA_TIMEZONE,
    ...options,
  }).format(date);
}

export function dateKeyInBayArea(
  value: string | number | Date | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  const date =
    typeof value === "string"
      ? parseDateTimeInBayArea(value)
      : toDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BAY_AREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}
