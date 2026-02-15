import type { ExtractedEvent } from "@/types/import";

const MAX_ENRICH_EVENTS = 24;
const MAX_CONCURRENT_FETCHES = 4;
const FETCH_TIMEOUT_MS = 7000;

function resolveMaybeRelativeUrl(
  rawUrl: string,
  baseUrl: string
): string | null {
  try {
    const parsed = new URL(rawUrl, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function stripHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const resolved = resolveMaybeRelativeUrl(stripHtmlEntities(match[1]), baseUrl);
    if (resolved) return resolved;
  }

  return null;
}

function pickImageFromJsonLdImage(
  image: unknown,
  baseUrl: string
): string | null {
  if (!image) return null;

  if (typeof image === "string") {
    return resolveMaybeRelativeUrl(image, baseUrl);
  }

  if (Array.isArray(image)) {
    for (const value of image) {
      const resolved = pickImageFromJsonLdImage(value, baseUrl);
      if (resolved) return resolved;
    }
    return null;
  }

  if (typeof image === "object" && image !== null) {
    const maybeUrl = (image as { url?: unknown }).url;
    if (typeof maybeUrl === "string") {
      return resolveMaybeRelativeUrl(maybeUrl, baseUrl);
    }
  }

  return null;
}

function collectJsonLdCandidates(obj: unknown): Record<string, unknown>[] {
  if (!obj || typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => collectJsonLdCandidates(item));
  }

  const out: Record<string, unknown>[] = [obj as Record<string, unknown>];
  const graph = (obj as { "@graph"?: unknown })["@graph"];
  if (graph) {
    out.push(...collectJsonLdCandidates(graph));
  }
  return out;
}

function extractJsonLdImage(html: string, baseUrl: string): string | null {
  const blocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!blocks) return null;

  for (const block of blocks) {
    const jsonMatch = block.match(
      /<script[^>]*>([\s\S]*?)<\/script>/i
    );
    if (!jsonMatch?.[1]) continue;

    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const candidates = collectJsonLdCandidates(parsed);

      for (const candidate of candidates) {
        const type = candidate["@type"];
        const isEvent =
          type === "Event" ||
          (Array.isArray(type) && type.includes("Event"));
        if (!isEvent) continue;

        const image = pickImageFromJsonLdImage(candidate.image, baseUrl);
        if (image) return image;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchPageImage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; TechWeekBot/1.0; +https://techweek.dev)",
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await response.text();
    return extractMetaImage(html, url) || extractJsonLdImage(html, url);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function parallelMap<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function runOne() {
    while (index < items.length) {
      const current = index;
      index++;
      results[current] = await worker(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runOne()
  );
  await Promise.all(workers);
  return results;
}

export async function enrichEventsWithImages(
  events: ExtractedEvent[],
  sourceUrl: string
): Promise<ExtractedEvent[]> {
  const missing = events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => !event.imageUrl)
    .slice(0, MAX_ENRICH_EVENTS);

  if (missing.length === 0) return events;

  const urlToImage = new Map<string, string | null>();

  await parallelMap(
    missing,
    async ({ event }) => {
      const url = event.website || sourceUrl;
      if (!urlToImage.has(url)) {
        urlToImage.set(url, await fetchPageImage(url));
      }
      return null;
    },
    MAX_CONCURRENT_FETCHES
  );

  return events.map((event) => {
    if (event.imageUrl) return event;
    const url = event.website || sourceUrl;
    const imageUrl = urlToImage.get(url) || null;
    return imageUrl ? { ...event, imageUrl } : event;
  });
}
