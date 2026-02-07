import Firecrawl from "@mendable/firecrawl-js";

let _client: Firecrawl | null = null;

function getClient(): Firecrawl {
  if (!_client) {
    _client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
  }
  return _client;
}

interface ScrapeResult {
  markdown: string;
  links: string[];
  title: string;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const result = await getClient().scrape(url, {
    formats: ["markdown", "links"],
  });

  return {
    markdown: result.markdown || "",
    links: result.links || [],
    title: result.metadata?.title || "",
  };
}

const PRICING_KEYWORDS = [
  "register",
  "tickets",
  "attend",
  "pricing",
  "buy",
  "passes",
];

export async function scrapePricingPages(
  links: string[],
  baseUrl: string
): Promise<string> {
  const base = new URL(baseUrl);

  const pricingLinks = links
    .filter((link) => {
      try {
        const u = new URL(link, baseUrl);
        if (u.hostname !== base.hostname) return false;
        const path = u.pathname.toLowerCase();
        return PRICING_KEYWORDS.some((kw) => path.includes(kw));
      } catch {
        return false;
      }
    })
    .slice(0, 3);

  if (pricingLinks.length === 0) return "";

  const results = await Promise.allSettled(
    pricingLinks.map((link) => scrapeUrl(new URL(link, baseUrl).href))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ScrapeResult> => r.status === "fulfilled"
    )
    .map((r) => `--- Pricing page: ${r.value.title} ---\n${r.value.markdown}`)
    .join("\n\n");
}
