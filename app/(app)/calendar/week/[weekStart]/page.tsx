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
import { getUserNewsletterStatus } from "@/lib/queries/users";
import { WeekGrid } from "@/components/calendar/week-grid";
import { SuggestEventForm } from "@/components/calendar/suggest-event-form";
import { CalendarNav } from "@/components/calendar/calendar-nav";
import { CategoryFilter } from "@/components/calendar/category-filter";
import { NewsletterBanner } from "@/components/calendar/newsletter-banner";
import { CalendarContextNote } from "@/components/calendar/calendar-context-note";

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

  const [events, featuredEvents, newsletterOptIn] = await Promise.all([
    getEventsBetweenFiltered(
      weekStart,
      weekEnd,
      eventTypes.length > 0 ? eventTypes : undefined
    ),
    getFeaturedEvents(weekStart, weekEnd),
    session?.user?.id
      ? getUserNewsletterStatus(session.user.id).catch(() => false)
      : Promise.resolve(false),
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
      <CalendarContextNote isLoggedIn={!!session} />

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

      <div className="relative mb-4 flex items-end justify-center">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            TechWeek Weekly View
          </p>
          <h1 className="text-xl font-black tracking-tight sm:text-3xl">
            <span className="hidden sm:inline">Week of </span>
            {getShortMonthName(weekStart.getMonth())} {weekStart.getDate()}{" "}
            &ndash; {getShortMonthName(weekEnd.getMonth())} {weekEnd.getDate()},{" "}
            {weekEnd.getFullYear()}
          </h1>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <Suspense>
            <CategoryFilter />
          </Suspense>
        </div>
      </div>

      <NewsletterBanner
        isLoggedIn={!!session}
        newsletterOptIn={newsletterOptIn}
      />

      <WeekGrid
        weekStartParam={weekParam}
        events={events}
        featuredEvents={filteredFeatured}
        isLoggedIn={!!session}
      />
      <SuggestEventForm isLoggedIn={!!session} />
    </div>
  );
}
