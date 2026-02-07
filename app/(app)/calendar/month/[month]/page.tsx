export const dynamic = "force-dynamic";

import { getEventsBetween } from "@/lib/queries/events";
import {
  parseMonthParam,
  formatMonthParam,
  getMonthStart,
  getMonthEnd,
  getMonthName,
} from "@/lib/utils/date";
import { MonthGrid } from "@/components/calendar/month-grid";
import { CalendarNav } from "@/components/calendar/calendar-nav";

interface Props {
  params: Promise<{ month: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { month: monthParam } = await params;
  const { year, month } = parseMonthParam(monthParam);
  return { title: `${getMonthName(month)} ${year} — TechWeek` };
}

export default async function MonthPage({ params }: Props) {
  const { month: monthParam } = await params;
  const { year, month } = parseMonthParam(monthParam);

  const start = getMonthStart(year, month);
  const end = getMonthEnd(year, month);
  const events = await getEventsBetween(start, end);

  // Prev/Next month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  return (
    <div>
      <CalendarNav
        breadcrumbs={[
          { label: "Calendar", href: "/calendar" },
          { label: `${getMonthName(month)} ${year}` },
        ]}
        prevHref={`/calendar/month/${formatMonthParam(prevYear, prevMonth)}`}
        nextHref={`/calendar/month/${formatMonthParam(nextYear, nextMonth)}`}
        prevLabel={getMonthName(prevMonth)}
        nextLabel={getMonthName(nextMonth)}
      />

      <h1 className="text-2xl font-bold mb-4">
        {getMonthName(month)} {year}
      </h1>

      <MonthGrid year={year} month={month} events={events} />

      {events.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          No events this month yet.
        </p>
      )}
    </div>
  );
}
