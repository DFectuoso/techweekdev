import Link from "next/link";
import type { Event } from "@/lib/db/schema";
import {
  getMonthName,
  getCalendarDays,
  formatMonthParam,
  formatDateParam,
  getWeekStartForRow,
} from "@/lib/utils/date";
import { EventDensityIndicator } from "./event-density-indicator";
import { FeaturedMarker } from "./featured-marker";

interface YearOverviewProps {
  year: number;
  /** Events keyed by "YYYY-MM" */
  eventsByMonth: Record<string, Event[]>;
  featuredByMonth: Record<string, Event[]>;
}

export function YearOverview({
  year,
  eventsByMonth,
  featuredByMonth,
}: YearOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, month) => {
        const key = formatMonthParam(year, month);
        const monthEvents = eventsByMonth[key] || [];
        const featured = featuredByMonth[key] || [];

        return (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            events={monthEvents}
            featured={featured}
          />
        );
      })}
    </div>
  );
}

function MiniMonth({
  year,
  month,
  events,
  featured,
}: {
  year: number;
  month: number;
  events: Event[];
  featured: Event[];
}) {
  const days = getCalendarDays(year, month);
  const dayHeaders = ["M", "T", "W", "T", "F", "S", "S"];
  const monthParam = formatMonthParam(year, month);

  // Count events per day
  const eventCountByDay: Record<number, number> = {};
  for (const event of events) {
    const d = new Date(event.startDate).getDate();
    eventCountByDay[d] = (eventCountByDay[d] || 0) + 1;
  }

  // Split days into week rows
  const rows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <Link
        href={`/calendar/month/${monthParam}`}
        className="block text-sm font-semibold hover:text-primary mb-2"
      >
        {getMonthName(month)} {year}
      </Link>

      <div className="grid grid-cols-7 gap-0">
        {dayHeaders.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-muted-foreground pb-1"
          >
            {d}
          </div>
        ))}

        {rows.map((row, rowIdx) => {
          // Find first real day in the row for week navigation
          const firstRealDay = row.find((d) => d !== null);
          const weekStart = firstRealDay
            ? getWeekStartForRow(year, month, firstRealDay)
            : null;
          const weekHref = weekStart
            ? `/calendar/week/${formatDateParam(weekStart)}`
            : undefined;

          return row.map((day, colIdx) => {
            const cellKey = `${rowIdx}-${colIdx}`;
            if (day === null) {
              return <div key={cellKey} className="h-6" />;
            }

            const count = eventCountByDay[day] || 0;
            const today = new Date();
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;

            const inner = (
              <div
                className={`flex h-6 flex-col items-center justify-center rounded text-[10px] ${
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-foreground"
                }`}
              >
                <span>{day}</span>
                <EventDensityIndicator count={count} />
              </div>
            );

            if (weekHref && colIdx === 0) {
              return (
                <Link
                  key={cellKey}
                  href={weekHref}
                  className="hover:bg-accent rounded"
                  title={`Week view`}
                >
                  {inner}
                </Link>
              );
            }

            return <div key={cellKey}>{inner}</div>;
          });
        })}
      </div>

      <FeaturedMarker events={featured} />
    </div>
  );
}
