const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
]);

const LUMA_HOSTS = new Set(["lu.ma", "luma.com"]);

function parseUrlWithOptionalProtocol(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    // Support host/path inputs like "lu.ma/abcd1234"
    try {
      return new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }
}

function buildNormalizedUrl(parsed: URL): string {
  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }

  // Treat luma.com and lu.ma as equivalent canonical hosts.
  if (hostname === "luma.com") {
    hostname = "lu.ma";
  }

  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const params = new URLSearchParams();
  const entries = Array.from(parsed.searchParams.entries())
    .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of entries) {
    params.append(key, value);
  }

  const query = params.toString();
  return `${parsed.protocol}//${hostname}${pathname}${query ? `?${query}` : ""}`;
}

function getLumaHostVariants(normalized: string): string[] {
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return [normalized];
  }

  if (!LUMA_HOSTS.has(parsed.hostname)) {
    return [normalized];
  }

  const candidates = new Set<string>([normalized]);
  const alternateHost = parsed.hostname === "lu.ma" ? "luma.com" : "lu.ma";
  candidates.add(
    `${parsed.protocol}//${alternateHost}${parsed.pathname}${parsed.search}`
  );
  return Array.from(candidates);
}

/**
 * Normalize a URL for deduplication.
 * Lowercase hostname, strip www., remove trailing slash,
 * remove tracking params, sort remaining query params, remove hash.
 * Returns null for empty/invalid input.
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;

  const parsed = parseUrlWithOptionalProtocol(url.trim());
  if (!parsed) return null;

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  return buildNormalizedUrl(parsed);
}

/**
 * Returns normalized URL candidates that should be treated as equivalent.
 * Includes legacy luma.com/lu.ma host variants for backwards compatibility
 * with already-stored normalized URLs.
 */
export function normalizeUrlCandidates(
  url: string | null | undefined
): string[] {
  const normalized = normalizeUrl(url);
  if (!normalized) return [];
  return getLumaHostVariants(normalized);
}
