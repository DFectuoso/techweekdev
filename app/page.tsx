export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { count, gte } from "drizzle-orm";
import { EpicLanding } from "@/components/landing/epic-landing";
import { db } from "@/lib/db";
import { type Event, events, users } from "@/lib/db/schema";
import { getEventsBetweenFiltered, getFeaturedEvents } from "@/lib/queries/events";
import {
  formatDateParam,
  generateDateRange,
  getMonthEnd,
  getMonthStart,
  getWeekEnd,
  getWeekStart,
} from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "TechWeek.dev - Never Miss Another Bay Area Tech Event",
  description:
    "One calendar for Bay Area AI meetups, hackathons, founder dinners, and conferences. Browse the calendar in seconds.",
  openGraph: {
    title: "TechWeek.dev - Never Miss Another Bay Area Tech Event",
    description:
      "One calendar for Bay Area AI meetups, hackathons, founder dinners, and conferences.",
    type: "website",
    images: ["https://techweek.dev/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TechWeek.dev - Never Miss Another Bay Area Tech Event",
    description:
      "One calendar for Bay Area AI meetups, hackathons, founder dinners, and conferences.",
    images: ["https://techweek.dev/og-image.png"],
  },
};

type LandingPreviewData = {
  heroYearDates: string[];
  heroYearEventCountByDate: Record<string, number>;
  heroYearFeaturedEvents: Event[];
  showcaseWeekStartParam: string;
  showcaseWeekEvents: Event[];
  showcaseWeekFeaturedEvents: Event[];
};

function quantizeCount(countValue: number): number {
  if (countValue <= 0) return 0;
  if (countValue <= 2) return 1;
  if (countValue <= 5) return 3;
  return 6;
}

function createPreviewEvent({
  id,
  name = "Members-only event",
  website = null,
  startDate,
  endDate,
  isFeatured = false,
  eventType = "other",
}: {
  id: string;
  name?: string;
  website?: string | null;
  startDate: Date;
  endDate?: Date;
  isFeatured?: boolean;
  eventType?: Event["eventType"];
}): Event {
  const now = new Date();
  return {
    id,
    name,
    description: null,
    website,
    normalizedWebsite: null,
    price: null,
    startDate,
    endDate: endDate ?? null,
    isFeatured,
    eventType,
    region: "other",
    createdAt: now,
    updatedAt: now,
  };
}

function buildWeekShowcaseData({
  weekStart,
  weekEvents,
  weekFeatured,
}: {
  weekStart: Date;
  weekEvents: Event[];
  weekFeatured: Event[];
}): Pick<
  LandingPreviewData,
  "showcaseWeekStartParam" | "showcaseWeekEvents" | "showcaseWeekFeaturedEvents"
> {
  const featuredIds = new Set(weekFeatured.map((e) => e.id));
  const previewEvents: Event[] = weekEvents.map((event, index) =>
    createPreviewEvent({
      id: `landing-week-real-${index}`,
      name: "Members-only event",
      website: index % 2 === 0 ? "/signup" : "/login",
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : undefined,
      isFeatured: featuredIds.has(event.id),
      eventType: event.eventType || "other",
    })
  );

  const previewFeatured = previewEvents.filter((e) => e.isFeatured);

  return {
    showcaseWeekStartParam: formatDateParam(weekStart),
    showcaseWeekEvents: previewEvents,
    showcaseWeekFeaturedEvents: previewFeatured,
  };
}

async function getLandingStats() {
  try {
    const [eventCount] = await db
      .select({ count: count() })
      .from(events)
      .where(gte(events.startDate, new Date()));
    const [userCount] = await db.select({ count: count() }).from(users);

    return {
      upcomingEvents: eventCount?.count ?? 0,
      insiders: userCount?.count ?? 0,
    };
  } catch {
    return {
      upcomingEvents: 0,
      insiders: 0,
    };
  }
}

async function getLandingPreviewData(): Promise<LandingPreviewData> {
  const now = new Date();
  const day = now.getDay();
  const referenceDate = new Date(now);
  if (day === 6) {
    referenceDate.setDate(referenceDate.getDate() + 2);
  } else if (day === 0) {
    referenceDate.setDate(referenceDate.getDate() + 1);
  }

  const weekStart = getWeekStart(referenceDate);
  const weekEnd = getWeekEnd(weekStart);

  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const yearStart = getMonthStart(year, currentMonth);
  const endMonth = currentMonth + 11;
  const endYear = year + Math.floor(endMonth / 12);
  const endMonthNorm = endMonth % 12;
  const yearEnd = getMonthEnd(endYear, endMonthNorm);

  const [weekEventsRaw, weekFeaturedRaw, yearEventsRaw, yearFeaturedRaw] =
    await Promise.all([
      getEventsBetweenFiltered(weekStart, weekEnd),
      getFeaturedEvents(weekStart, weekEnd),
      getEventsBetweenFiltered(yearStart, yearEnd),
      getFeaturedEvents(yearStart, yearEnd),
    ]);

  const weekShowcase = buildWeekShowcaseData({
    weekStart,
    weekEvents: weekEventsRaw,
    weekFeatured: weekFeaturedRaw,
  });

  const dates = generateDateRange(year, currentMonth, 12);
  const yearDates = dates.map((d) => formatDateParam(d));

  const rawCounts: Record<string, number> = {};
  for (const event of yearEventsRaw) {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endDay) {
      const key = formatDateParam(cursor);
      rawCounts[key] = (rawCounts[key] || 0) + 1;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const yearEventCountByDate: Record<string, number> = {};
  for (const d of yearDates) {
    yearEventCountByDate[d] = quantizeCount(rawCounts[d] || 0);
  }

  const heroYearFeaturedEvents: Event[] = yearFeaturedRaw.slice(0, 24).map((event, index) => {
    const startDate = new Date(event.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = event.endDate ? new Date(event.endDate) : undefined;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    return createPreviewEvent({
      id: `landing-hero-year-featured-${index}`,
      name: "Create account to see details",
      website: index % 2 === 0 ? "/signup" : "/login",
      startDate,
      endDate,
      isFeatured: true,
    });
  });

  if (heroYearFeaturedEvents.length < 10) {
    const activeDates = yearDates.filter((d) => (yearEventCountByDate[d] || 0) > 0);
    const sourceDates = activeDates.length > 0 ? activeDates : yearDates;
    const step = Math.max(1, Math.floor(sourceDates.length / 18));
    let fallbackIndex = heroYearFeaturedEvents.length;

    for (let i = 0; i < sourceDates.length && fallbackIndex < 24; i += step) {
      const [y, m, d] = sourceDates[i]!.split("-").map(Number);
      const startDate = new Date(y!, m! - 1, d!);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      if (fallbackIndex % 3 === 0) endDate.setDate(endDate.getDate() + 1);

      heroYearFeaturedEvents.push(
        createPreviewEvent({
          id: `landing-hero-year-fallback-${fallbackIndex}`,
          name: "Create account to see details",
          website: fallbackIndex % 2 === 0 ? "/signup" : "/login",
          startDate,
          endDate,
          isFeatured: true,
        }),
      );
      fallbackIndex += 1;
    }
  }

  return {
    heroYearDates: yearDates,
    heroYearEventCountByDate: yearEventCountByDate,
    heroYearFeaturedEvents,
    showcaseWeekStartParam: weekShowcase.showcaseWeekStartParam,
    showcaseWeekEvents: weekShowcase.showcaseWeekEvents,
    showcaseWeekFeaturedEvents: weekShowcase.showcaseWeekFeaturedEvents,
  };
}

export default async function LandingPage() {
  const [stats, previews] = await Promise.all([
    getLandingStats(),
    getLandingPreviewData(),
  ]);

  return <EpicLanding stats={stats} previews={previews} />;
}
