import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeUrl, scrapePricingPages } from "@/lib/firecrawl";
import { extractEvents, enrichEventsFromDetailPages } from "@/lib/ai/extract-events";
import { isLumaUrl, fetchLumaEvents } from "@/lib/luma";
import type { ImportResponse } from "@/types/import";

export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let url: string;
  try {
    const body = await request.json();
    url = body.url;
    // Validate URL
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Please provide a valid URL" },
      { status: 400 }
    );
  }

  try {
    // Fast path: Luma URLs have structured data we can parse directly
    if (isLumaUrl(url)) {
      const lumaResult = await fetchLumaEvents(url);
      if (lumaResult) {
        return NextResponse.json({
          events: lumaResult.events,
          sourceUrl: url,
          pageType: lumaResult.pageType,
        });
      }
      // Fall through to generic scrape+AI if Luma parsing failed
    }

    // 1. Scrape the main URL
    const scrapeResult = await scrapeUrl(url);

    if (!scrapeResult.markdown.trim()) {
      return NextResponse.json(
        { error: "The page appears to be empty or could not be read" },
        { status: 422 }
      );
    }

    // 2. First-pass extraction (pass links for URL matching)
    let result = await extractEvents(
      scrapeResult.markdown,
      undefined,
      url,
      scrapeResult.links
    );

    // 3. If single event with no price, try scraping pricing subpages
    if (
      result.pageType === "single" &&
      result.events.length === 1 &&
      !result.events[0].price
    ) {
      const pricingMarkdown = await scrapePricingPages(
        scrapeResult.links,
        url
      );

      if (pricingMarkdown) {
        result = await extractEvents(
          scrapeResult.markdown,
          pricingMarkdown,
          url,
          scrapeResult.links
        );
      }
    }

    // 4. If listing page, enrich events missing dates by scraping detail pages
    if (result.pageType === "listing" && result.events.length > 0) {
      result.events = await enrichEventsFromDetailPages(
        result.events,
        url
      );
    }

    const response: ImportResponse = {
      events: result.events,
      sourceUrl: url,
      pageType: result.pageType,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    if (message.includes("rate limit") || message.includes("429")) {
      return NextResponse.json(
        { error: "Rate limited — please wait a moment and try again" },
        { status: 429 }
      );
    }

    console.error("Import error:", error);
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 500 }
    );
  }
}
