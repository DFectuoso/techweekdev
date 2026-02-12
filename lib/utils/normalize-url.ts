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

/**
 * Normalize a URL for deduplication.
 * Lowercase hostname, strip www., remove trailing slash,
 * remove tracking params, sort remaining query params, remove hash.
 * Returns null for empty/invalid input.
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  // Lowercase hostname and strip www.
  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }

  // Remove trailing slash from pathname
  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  // Filter out tracking params and sort remaining
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
