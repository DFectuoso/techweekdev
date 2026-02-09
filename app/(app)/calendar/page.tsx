import { Suspense } from "react";
import {
  getEventsBetweenFiltered,
  getFeaturedEvents,
} from "@/lib/queries/events";
import {
  getMonthStart,
  getMonthEnd,
  generateDateRange,
  formatDateParam,
} from "@/lib/utils/date";
import { parseEventTypeFilter } from "@/lib/utils/filters";
import { auth } from "@/lib/auth";
import { getUserNewsletterStatus } from "@/lib/queries/users";
import { YearGrid } from "@/components/calendar/year-grid";
import { SuggestEventForm } from "@/components/calendar/suggest-event-form";
import { CategoryFilter } from "@/components/calendar/category-filter";
import { NewsletterBanner } from "@/components/calendar/newsletter-banner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar — TechWeek" };

interface Props {
  searchParams: Promise<{ types?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const { types: typesParam } = await searchParams;
  const eventTypes = parseEventTypeFilter(typesParam);

  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const start = getMonthStart(year, currentMonth);
  const endMonth = currentMonth + 11;
  const endYear = year + Math.floor(endMonth / 12);
  const endMonthNorm = endMonth % 12;
  const end = getMonthEnd(endYear, endMonthNorm);

  const session = await auth();

  const [allEvents, featuredEvents, newsletterOptIn] = await Promise.all([
    getEventsBetweenFiltered(start, end, eventTypes.length > 0 ? eventTypes : undefined),
    getFeaturedEvents(start, end),
    session?.user?.id ? getUserNewsletterStatus(session.user.id).catch(() => true) : Promise.resolve(true),
  ]);

  // Generate date range for 12 months
  const dates = generateDateRange(year, currentMonth, 12);
  const dateStrings = dates.map((d) => formatDateParam(d));

  // Count events per date, distributing multi-day events across all days they span
  const eventCountByDate: Record<string, number> = {};
  for (const event of allEvents) {
    const s = new Date(event.startDate);
    const e = event.endDate ? new Date(event.endDate) : s;
    const current = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    while (current <= endDay) {
      const key = formatDateParam(current);
      eventCountByDate[key] = (eventCountByDate[key] || 0) + 1;
      current.setDate(current.getDate() + 1);
    }
  }

  // Filter featured events to only those in range
  const filteredFeatured = featuredEvents.filter((e) => {
    if (eventTypes.length === 0) return true;
    return e.eventType && eventTypes.includes(e.eventType);
  });

  return (
    <div className="py-6 sm:px-4">
      <div className="relative mb-6 flex items-center justify-center px-4 sm:px-0">
        <h1 className="text-2xl font-bold">{year}</h1>
        <div className="absolute right-4 sm:right-0">
          <Suspense>
            <CategoryFilter />
          </Suspense>
        </div>
      </div>
      {!newsletterOptIn && <NewsletterBanner />}
      <YearGrid
        dates={dateStrings}
        eventCountByDate={eventCountByDate}
        featuredEvents={filteredFeatured}
      />
      <SuggestEventForm isLoggedIn={!!session} />
    </div>
  );
}
