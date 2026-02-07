import Anthropic from "@anthropic-ai/sdk";
import { EVENT_TYPES, REGIONS } from "@/lib/db/schema";
import type { EventType, Region } from "@/lib/db/schema";
import type { ExtractedEvent } from "@/types/import";
import { scrapeUrl } from "@/lib/firecrawl";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _client;
}

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `You are a data extraction assistant. Your job is to extract tech event information from web page content and return structured JSON.

Today's date is ${today}.

INSTRUCTIONS:
1. Analyze the provided markdown content from a web page.
2. Classify the page as one of:
   - "single": A page about one specific event
   - "listing": A page listing multiple events
   - "none": Not an event page
3. Extract event data into structured JSON.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code fences) in this exact shape:
{
  "pageType": "single" | "listing" | "none",
  "events": [
    {
      "name": "Event Name",
      "description": "Brief description of the event",
      "website": "https://event-url.com",
      "price": "Free" | "$50" | "$499-$1,299" | "From $99" | "Invite Only" | null,
      "startDate": "2025-06-15T09:00:00",
      "endDate": "2025-06-15T17:00:00",
      "eventType": "hackathon" | "networking" | "conference" | "pitch" | "demoday" | "workshop" | "other" | null,
      "region": "SF" | "Peninsula" | "South Bay" | "East Bay" | "North Bay" | "other" | null,
      "isFeatured": false,
      "confidence": 0.85
    }
  ]
}

RULES:
- Dates must be in YYYY-MM-DDTHH:MM:SS format WITHOUT a timezone suffix (no "Z"). All times are San Francisco local time (America/Los_Angeles). If only a date is given without time, use T00:00:00.
- Use today's date (${today}) to resolve relative dates like "Tomorrow", "Next Tuesday", "This Saturday", etc.
- If the year is missing from a date, assume the current year (${new Date().getFullYear()}).
- Price should be a human-readable string: "Free", "$50", "$499-$1,299", "From $99", "Invite Only", etc. Set null if unknown.
- eventType MUST be one of: ${EVENT_TYPES.join(", ")}. Set null if unsure.
- region MUST be one of: ${REGIONS.join(", ")}. Set null if the event location doesn't match any region.
- isFeatured should always be false (admin decides).
- confidence is 0-1, reflecting how confident you are this is a real, correctly-extracted event.
- For listing pages, extract as many events as you can find.
- For single event pages, extract just that one event.
- For non-event pages, return an empty events array.
- If pricing information is provided in a separate section, use it to fill in prices.
- For the "website" field: use the individual event page URL (not the listing page URL). Match event names to URLs from the provided links list when available. Set null if no individual event URL can be determined.`;
}

const MAX_INPUT_CHARS = 150_000;

interface ExtractionResult {
  pageType: "single" | "listing" | "none";
  events: ExtractedEvent[];
}

export async function extractEvents(
  mainMarkdown: string,
  pricingMarkdown?: string,
  sourceUrl?: string,
  links?: string[]
): Promise<ExtractionResult> {
  let content = mainMarkdown;
  if (pricingMarkdown) {
    content += "\n\n=== PRICING INFORMATION ===\n\n" + pricingMarkdown;
  }

  if (links && links.length > 0) {
    content += "\n\n=== LINKS FOUND ON PAGE ===\n\n" + links.join("\n");
  }

  // Truncate to stay within limits
  if (content.length > MAX_INPUT_CHARS) {
    content = content.slice(0, MAX_INPUT_CHARS);
  }

  const sourceInfo = sourceUrl ? `\nSource URL: ${sourceUrl}` : "";

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: `Extract event information from this web page content:${sourceInfo}\n\n${content}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: { pageType: string; events: RawEvent[] };
  try {
    // Strip potential markdown code fences
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { pageType: "none", events: [] };
  }

  const pageType = validatePageType(parsed.pageType);
  const fallbackWebsite = pageType !== "listing";
  const events = (parsed.events || []).map((raw: RawEvent, i: number) =>
    normalizeEvent(raw, i, fallbackWebsite ? sourceUrl : undefined)
  );

  return { pageType, events };
}

interface RawEvent {
  name?: string;
  description?: string;
  website?: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  region?: string;
  isFeatured?: boolean;
  confidence?: number;
}

function validatePageType(
  type: string
): "single" | "listing" | "none" {
  if (type === "single" || type === "listing" || type === "none") return type;
  return "none";
}

/** Strip trailing "Z" or timezone offset (e.g. "+00:00") so the string is a naive local datetime. */
function normalizeDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  // Remove Z suffix or +HH:MM / -HH:MM offset
  return dateStr.replace(/Z$/i, "").replace(/[+-]\d{2}:\d{2}$/, "");
}

function normalizeEvent(
  raw: RawEvent,
  index: number,
  sourceUrl?: string
): ExtractedEvent {
  return {
    _tempId: `import-${Date.now()}-${index}`,
    name: raw.name || null,
    description: raw.description || null,
    website: raw.website || sourceUrl || null,
    price: raw.price || null,
    startDate: normalizeDate(raw.startDate),
    endDate: normalizeDate(raw.endDate),
    eventType: validateEventType(raw.eventType),
    region: validateRegion(raw.region),
    isFeatured: false,
    _confidence: typeof raw.confidence === "number" ? raw.confidence : 0.5,
  };
}

function validateEventType(type?: string): EventType | null {
  if (!type) return null;
  return (EVENT_TYPES as readonly string[]).includes(type)
    ? (type as EventType)
    : null;
}

function validateRegion(region?: string): Region | null {
  if (!region) return null;
  return (REGIONS as readonly string[]).includes(region)
    ? (region as Region)
    : null;
}

// ── Classify Luma events (fill in eventType, region, description) ────

export async function classifyEvents(
  events: ExtractedEvent[]
): Promise<ExtractedEvent[]> {
  // Find events missing at least one of eventType, region, or description
  const needsClassification = events.filter(
    (e) => e.eventType === null || e.region === null || e.description === null
  );

  if (needsClassification.length === 0) return events;

  // Build a lightweight prompt listing just the events
  const eventLines = needsClassification.map((e, i) => {
    const desc = e.description ? ` — ${e.description}` : "";
    const url = e.website ? ` (${e.website})` : "";
    return `${i + 1}. "${e.name}"${url}${desc}`;
  });

  const systemPrompt = `You classify Bay Area tech events. For each event, provide:
- eventType: one of ${EVENT_TYPES.join(", ")}
- region: one of ${REGIONS.join(", ")}
- description: a brief 1-2 sentence description of the event

Return ONLY a JSON array (no markdown, no code fences) with one object per event, in the same order:
[{ "eventType": "...", "region": "...", "description": "..." }, ...]

If you cannot determine a field, set it to null.`;

  try {
    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Classify these tech events:\n\n${eventLines.join("\n")}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const classifications: Array<{
      eventType?: string;
      region?: string;
      description?: string;
    }> = JSON.parse(cleaned);

    if (!Array.isArray(classifications)) return events;

    // Build a map from _tempId to classification
    const classMap = new Map<
      string,
      { eventType?: string; region?: string; description?: string }
    >();
    needsClassification.forEach((e, i) => {
      if (i < classifications.length) {
        classMap.set(e._tempId, classifications[i]);
      }
    });

    // Merge — only fill in fields that are currently null
    return events.map((event) => {
      const c = classMap.get(event._tempId);
      if (!c) return event;
      return {
        ...event,
        eventType: event.eventType ?? validateEventType(c.eventType),
        region: event.region ?? validateRegion(c.region),
        description: event.description ?? (c.description || null),
      };
    });
  } catch (err) {
    console.error("classifyEvents failed, returning original events:", err);
    return events;
  }
}

const ENRICHMENT_BATCH_SIZE = 3;
const MAX_ENRICHMENT_EVENTS = 10;

export async function enrichEventsFromDetailPages(
  events: ExtractedEvent[],
  sourceUrl: string
): Promise<ExtractedEvent[]> {
  // Find events that need enrichment: missing dates but have a distinct URL
  const candidates = events.filter(
    (e) =>
      e.startDate === null &&
      e.website !== null &&
      e.website !== sourceUrl
  );

  if (candidates.length === 0) return events;

  const toEnrich = candidates.slice(0, MAX_ENRICHMENT_EVENTS);

  // Build a map of website -> enriched data
  const enrichedMap = new Map<string, ExtractedEvent>();

  // Process in batches
  for (let i = 0; i < toEnrich.length; i += ENRICHMENT_BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + ENRICHMENT_BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (event) => {
        const scrapeResult = await scrapeUrl(event.website!);
        if (!scrapeResult.markdown.trim()) return null;

        const extraction = await extractEvents(
          scrapeResult.markdown,
          undefined,
          event.website!
        );

        if (extraction.events.length === 0) return null;
        return { url: event.website!, enriched: extraction.events[0] };
      })
    );

    for (const result of results) {
      if (
        result.status === "fulfilled" &&
        result.value !== null
      ) {
        enrichedMap.set(result.value.url, result.value.enriched);
      }
    }
  }

  // Merge enriched data back — only fill null fields
  return events.map((event) => {
    if (!event.website || !enrichedMap.has(event.website)) return event;

    const enriched = enrichedMap.get(event.website)!;
    return {
      ...event,
      description: event.description ?? enriched.description,
      startDate: event.startDate ?? enriched.startDate,
      endDate: event.endDate ?? enriched.endDate,
      price: event.price ?? enriched.price,
      eventType: event.eventType ?? enriched.eventType,
      region: event.region ?? enriched.region,
    };
  });
}
