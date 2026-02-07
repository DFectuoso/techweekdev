import { getEventsBetween, getFeaturedEvents } from "@/lib/queries/events";
import { getMonthStart, getMonthEnd, formatMonthParam } from "@/lib/utils/date";
import { YearOverview } from "@/components/calendar/year-overview";
import type { Event } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar — TechWeek" };

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  // Fetch events from current month through end of year
  const start = getMonthStart(year, currentMonth);
  const end = getMonthEnd(year, 11);

  const [allEvents, featuredEvents] = await Promise.all([
    getEventsBetween(start, end),
    getFeaturedEvents(start, end),
  ]);

  // Group by month key "YYYY-MM"
  const eventsByMonth: Record<string, Event[]> = {};
  const featuredByMonth: Record<string, Event[]> = {};

  for (const event of allEvents) {
    const d = new Date(event.startDate);
    const key = formatMonthParam(d.getFullYear(), d.getMonth());
    if (!eventsByMonth[key]) eventsByMonth[key] = [];
    eventsByMonth[key].push(event);
  }

  for (const event of featuredEvents) {
    const d = new Date(event.startDate);
    const key = formatMonthParam(d.getFullYear(), d.getMonth());
    if (!featuredByMonth[key]) featuredByMonth[key] = [];
    featuredByMonth[key].push(event);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{year} Events</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click a month for details, or a week row for the week view.
        </p>
      </div>
      <YearOverview
        year={year}
        eventsByMonth={eventsByMonth}
        featuredByMonth={featuredByMonth}
      />
    </div>
  );
}
