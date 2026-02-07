export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  getEventsBetweenFiltered,
  getFeaturedEvents,
} from "@/lib/queries/events";
import {
  parseDateParam,
  formatDateParam,
  getWeekEnd,
  getShortMonthName,
} from "@/lib/utils/date";
import { parseEventTypeFilter } from "@/lib/utils/filters";
import { auth } from "@/lib/auth";
import { WeekGrid } from "@/components/calendar/week-grid";
import { SuggestEventForm } from "@/components/calendar/suggest-event-form";
import { CalendarNav } from "@/components/calendar/calendar-nav";
import { CategoryFilter } from "@/components/calendar/category-filter";

interface Props {
  params: Promise<{ weekStart: string }>;
  searchParams: Promise<{ types?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { weekStart: weekParam } = await params;
  const start = parseDateParam(weekParam);
  return {
    title: `Week of ${getShortMonthName(start.getMonth())} ${start.getDate()} — TechWeek`,
  };
}

export default async function WeekPage({ params, searchParams }: Props) {
  const { weekStart: weekParam } = await params;
  const { types: typesParam } = await searchParams;
  const eventTypes = parseEventTypeFilter(typesParam);

  const weekStart = parseDateParam(weekParam);
  const weekEnd = getWeekEnd(weekStart);
  const session = await auth();

  const [events, featuredEvents] = await Promise.all([
    getEventsBetweenFiltered(
      weekStart,
      weekEnd,
      eventTypes.length > 0 ? eventTypes : undefined
    ),
    getFeaturedEvents(weekStart, weekEnd),
  ]);

  const filteredFeatured = featuredEvents.filter((e) => {
    if (eventTypes.length === 0) return true;
    return e.eventType && eventTypes.includes(e.eventType);
  });

  // Prev / next week
  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <CalendarNav
        breadcrumbs={[
          { label: "Calendar", href: "/calendar" },
          {
            label: `Week of ${getShortMonthName(weekStart.getMonth())} ${weekStart.getDate()}`,
          },
        ]}
        prevHref={`/calendar/week/${formatDateParam(prevWeek)}`}
        nextHref={`/calendar/week/${formatDateParam(nextWeek)}`}
        prevLabel="Prev week"
        nextLabel="Next week"
      />

      <h1 className="text-2xl font-bold mb-4">
        Week of {getShortMonthName(weekStart.getMonth())} {weekStart.getDate()}{" "}
        &ndash; {getShortMonthName(weekEnd.getMonth())} {weekEnd.getDate()},{" "}
        {weekEnd.getFullYear()}
      </h1>

      <div className="mb-4">
        <Suspense>
          <CategoryFilter />
        </Suspense>
      </div>

      <WeekGrid
        weekStart={weekStart}
        events={events}
        featuredEvents={filteredFeatured}
      />
      <SuggestEventForm isLoggedIn={!!session} />
    </div>
  );
}
