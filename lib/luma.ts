import type { ExtractedEvent } from "@/types/import";

const LUMA_HOSTNAMES = new Set([
  "lu.ma",
  "www.lu.ma",
  "luma.com",
  "www.luma.com",
]);

export function isLumaUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return LUMA_HOSTNAMES.has(hostname);
  } catch {
    return false;
  }
}

async function fetchLumaPage(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Luma fetch failed: ${res.status}`);
  return res.text();
}

/**
 * Convert a UTC ISO timestamp to a naive local datetime string
 * using the given IANA timezone (e.g. "America/Los_Angeles").
 * Returns "YYYY-MM-DDTHH:MM:SS".
 */
function utcToLocalNaive(utcIso: string, timezone: string): string {
  const date = new Date(utcIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

/**
 * Strip timezone offset from an ISO string that already includes one
 * (e.g. "2026-02-07T09:00:00.000-08:00" → "2026-02-07T09:00:00").
 */
function stripTimezoneOffset(iso: string): string {
  // Remove trailing Z, or +/-HH:MM offset, and any milliseconds
  return iso
    .replace(/\.\d{3}/, "")
    .replace(/Z$/, "")
    .replace(/[+-]\d{2}:\d{2}$/, "");
}

function resolveLumaImage(raw: unknown): string | null {
  if (typeof raw === "string" && raw.startsWith("http")) {
    return raw;
  }
  if (typeof raw === "object" && raw !== null) {
    const maybeUrl = (raw as { url?: unknown }).url;
    if (typeof maybeUrl === "string" && maybeUrl.startsWith("http")) {
      return maybeUrl;
    }
  }
  return null;
}

function extractLumaImage(e: Record<string, unknown>): string | null {
  return (
    resolveLumaImage(e.cover_url) ||
    resolveLumaImage(e.coverUrl) ||
    resolveLumaImage(e.header_image_url) ||
    resolveLumaImage(e.headerImageUrl) ||
    resolveLumaImage(e.social_image_url) ||
    resolveLumaImage(e.socialImageUrl) ||
    resolveLumaImage(e.image_url) ||
    resolveLumaImage(e.imageUrl) ||
    resolveLumaImage(e.image) ||
    null
  );
}

function getObjectPath(
  root: unknown,
  path: string[]
): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseLumaCalendarPage(html: string): ExtractedEvent[] | null {
  const match = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match) return null;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return null;
  }

  // Navigate to the events array — Luma nests it at props.pageProps.initialData.data.events
  // or directly at props.pageProps.events. We try multiple paths.
  const pageProps = getObjectPath(data, ["props", "pageProps"]);
  if (!pageProps) return null;

  const fromInitialDataData = getObjectPath(pageProps, ["initialData", "data", "events"]);
  const fromInitialData = getObjectPath(pageProps, ["initialData", "events"]);
  const fromPageProps = getObjectPath(pageProps, ["events"]);
  const events = [fromInitialDataData, fromInitialData, fromPageProps].find(
    (value) => Array.isArray(value)
  );

  if (!events || !Array.isArray(events) || events.length === 0) return null;

  const results: ExtractedEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    const evt = asRecord(events[i]);
    if (!evt) continue;
    // Some calendar pages nest the event inside an `event` key per entry
    const nested = asRecord(evt.event);
    const e = nested || evt;

    const name = typeof e.name === "string" ? e.name : null;
    const startAt = typeof e.start_at === "string" ? e.start_at : null;
    if (!name || !startAt) continue;

    const timezone =
      typeof e.timezone === "string" ? e.timezone : "America/Los_Angeles";
    const slug =
      (typeof e.url === "string" && e.url) ||
      (typeof e.api_id === "string" && e.api_id) ||
      "";
    const website = slug
      ? `https://lu.ma/${slug}`
      : null;

    results.push({
      _tempId: `luma-cal-${Date.now()}-${i}`,
      name,
      description: typeof e.description === "string" ? e.description : null,
      website,
      imageUrl: extractLumaImage(e),
      price: null,
      startDate: utcToLocalNaive(startAt, timezone),
      endDate:
        typeof e.end_at === "string"
          ? utcToLocalNaive(e.end_at, timezone)
          : null,
      eventType: null,
      region: null,
      isFeatured: false,
      _confidence: 0.95,
    });
  }

  return results.length > 0 ? results : null;
}

function parseLumaEventPage(
  html: string,
  url: string
): ExtractedEvent | null {
  // Find all JSON-LD blocks and look for @type: "Event"
  const regex =
    /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let jsonLdMatch: RegExpExecArray | null;

  while ((jsonLdMatch = regex.exec(html)) !== null) {
    let obj: unknown;
    try {
      obj = JSON.parse(jsonLdMatch[1]);
    } catch {
      continue;
    }

    // JSON-LD can be an object or an array
    const candidates = Array.isArray(obj) ? obj : [obj];
    for (const candidate of candidates) {
      const record = asRecord(candidate);
      if (!record || record["@type"] !== "Event") continue;

      return {
        _tempId: `luma-evt-${Date.now()}-0`,
        name: typeof record.name === "string" ? record.name : null,
        description:
          typeof record.description === "string" ? record.description : null,
        website: url,
        imageUrl: resolveLumaImage(record.image),
        price: null,
        startDate:
          typeof record.startDate === "string"
            ? stripTimezoneOffset(record.startDate)
            : null,
        endDate:
          typeof record.endDate === "string"
            ? stripTimezoneOffset(record.endDate)
            : null,
        eventType: null,
        region: null,
        isFeatured: false,
        _confidence: 0.95,
      };
    }
  }

  return null;
}

export async function fetchLumaEvents(
  url: string
): Promise<{ events: ExtractedEvent[]; pageType: "single" | "listing" } | null> {
  let html: string;
  try {
    html = await fetchLumaPage(url);
  } catch (err) {
    console.error("Luma fetch error:", err);
    return null;
  }

  // Try calendar/listing page first
  const calendarEvents = parseLumaCalendarPage(html);
  if (calendarEvents) {
    return { events: calendarEvents, pageType: "listing" };
  }

  // Try single event page
  const singleEvent = parseLumaEventPage(html, url);
  if (singleEvent) {
    return { events: [singleEvent], pageType: "single" };
  }

  // Neither worked — caller should fall back to generic scrape+AI
  return null;
}
