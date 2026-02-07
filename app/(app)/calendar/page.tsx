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
import { YearGrid } from "@/components/calendar/year-grid";
import { CategoryFilter } from "@/components/calendar/category-filter";

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

  const [allEvents, featuredEvents] = await Promise.all([
    getEventsBetweenFiltered(start, end, eventTypes.length > 0 ? eventTypes : undefined),
    getFeaturedEvents(start, end),
  ]);

  // Generate date range for 12 months
  const dates = generateDateRange(year, currentMonth, 12);
  const dateStrings = dates.map((d) => formatDateParam(d));

  // Count events per date
  const eventCountByDate: Record<string, number> = {};
  for (const event of allEvents) {
    const d = new Date(event.startDate);
    const key = formatDateParam(d);
    eventCountByDate[key] = (eventCountByDate[key] || 0) + 1;
  }

  // Filter featured events to only those in range
  const filteredFeatured = featuredEvents.filter((e) => {
    if (eventTypes.length === 0) return true;
    return e.eventType && eventTypes.includes(e.eventType);
  });

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{year} Events</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click any day to view the week.
        </p>
      </div>
      <div className="mb-4">
        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>
      <YearGrid
        dates={dateStrings}
        eventCountByDate={eventCountByDate}
        featuredEvents={filteredFeatured}
      />
    </div>
  );
}
