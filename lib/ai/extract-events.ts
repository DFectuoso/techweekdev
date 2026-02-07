import Anthropic from "@anthropic-ai/sdk";
import { EVENT_TYPES, REGIONS } from "@/lib/db/schema";
import type { EventType, Region } from "@/lib/db/schema";
import type { ExtractedEvent } from "@/types/import";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a data extraction assistant. Your job is to extract tech event information from web page content and return structured JSON.

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
- If the year is missing from a date, assume the current year (${new Date().getFullYear()}).
- Price should be a human-readable string: "Free", "$50", "$499-$1,299", "From $99", "Invite Only", etc. Set null if unknown.
- eventType MUST be one of: ${EVENT_TYPES.join(", ")}. Set null if unsure.
- region MUST be one of: ${REGIONS.join(", ")}. Set null if the event location doesn't match any region.
- isFeatured should always be false (admin decides).
- confidence is 0-1, reflecting how confident you are this is a real, correctly-extracted event.
- For listing pages, extract as many events as you can find.
- For single event pages, extract just that one event.
- For non-event pages, return an empty events array.
- If pricing information is provided in a separate section, use it to fill in prices.`;

const MAX_INPUT_CHARS = 150_000;

interface ExtractionResult {
  pageType: "single" | "listing" | "none";
  events: ExtractedEvent[];
}

export async function extractEvents(
  mainMarkdown: string,
  pricingMarkdown?: string,
  sourceUrl?: string
): Promise<ExtractionResult> {
  let content = mainMarkdown;
  if (pricingMarkdown) {
    content += "\n\n=== PRICING INFORMATION ===\n\n" + pricingMarkdown;
  }

  // Truncate to stay within limits
  if (content.length > MAX_INPUT_CHARS) {
    content = content.slice(0, MAX_INPUT_CHARS);
  }

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract event information from this web page content:\n\n${content}`,
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
  const events = (parsed.events || []).map((raw: RawEvent, i: number) =>
    normalizeEvent(raw, i, sourceUrl)
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
