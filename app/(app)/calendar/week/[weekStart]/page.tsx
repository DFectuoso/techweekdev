export const dynamic = "force-dynamic";

import { getEventsBetween } from "@/lib/queries/events";
import {
  parseDateParam,
  formatDateParam,
  formatMonthParam,
  getWeekEnd,
  getShortMonthName,
} from "@/lib/utils/date";
import { WeekView } from "@/components/calendar/week-view";
import { CalendarNav } from "@/components/calendar/calendar-nav";

interface Props {
  params: Promise<{ weekStart: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { weekStart: weekParam } = await params;
  const start = parseDateParam(weekParam);
  return {
    title: `Week of ${getShortMonthName(start.getMonth())} ${start.getDate()} — TechWeek`,
  };
}

export default async function WeekPage({ params }: Props) {
  const { weekStart: weekParam } = await params;
  const weekStart = parseDateParam(weekParam);
  const weekEnd = getWeekEnd(weekStart);

  const events = await getEventsBetween(weekStart, weekEnd);

  // Prev / next week
  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const monthParam = formatMonthParam(
    weekStart.getFullYear(),
    weekStart.getMonth()
  );

  return (
    <div>
      <CalendarNav
        breadcrumbs={[
          { label: "Calendar", href: "/calendar" },
          {
            label: `${getShortMonthName(weekStart.getMonth())} ${weekStart.getFullYear()}`,
            href: `/calendar/month/${monthParam}`,
          },
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

      <WeekView weekStart={weekStart} events={events} />
    </div>
  );
}
