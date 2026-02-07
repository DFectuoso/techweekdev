import Link from "next/link";
import type { Event } from "@/lib/db/schema";
import {
  getCalendarDays,
  getDayName,
  formatDateParam,
  getWeekStartForRow,
} from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";

interface MonthGridProps {
  year: number;
  month: number;
  events: Event[];
}

export function MonthGrid({ year, month, events }: MonthGridProps) {
  const days = getCalendarDays(year, month);
  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Group events by day
  const eventsByDay: Record<number, Event[]> = {};
  for (const event of events) {
    const d = new Date(event.startDate).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(event);
  }

  // Split into rows
  const rows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-border">
          {dayHeaders.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {rows.map((row, rowIdx) => {
          const firstRealDay = row.find((d) => d !== null);
          const weekStart = firstRealDay
            ? getWeekStartForRow(year, month, firstRealDay)
            : null;
          const weekHref = weekStart
            ? `/calendar/week/${formatDateParam(weekStart)}`
            : undefined;

          return (
            <div key={rowIdx} className="grid grid-cols-7 border-b border-border">
              {row.map((day, colIdx) => {
                const cellKey = `${rowIdx}-${colIdx}`;
                if (day === null) {
                  return (
                    <div key={cellKey} className="min-h-[80px] border-r border-border last:border-r-0 bg-muted/30" />
                  );
                }

                const dayEvents = eventsByDay[day] || [];
                const today = new Date();
                const isToday =
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === day;

                return (
                  <div
                    key={cellKey}
                    className="min-h-[80px] border-r border-border last:border-r-0 p-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      {weekHref && colIdx === 0 && (
                        <Link
                          href={weekHref}
                          className="text-[10px] text-muted-foreground hover:text-primary"
                          title="View week"
                        >
                          wk &rarr;
                        </Link>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                            event.isFeatured
                              ? "bg-primary/10 text-primary font-medium"
                              : "bg-muted text-muted-foreground"
                          }`}
                          title={event.name}
                        >
                          {event.name}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
