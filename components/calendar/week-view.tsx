import type { Event } from "@/lib/db/schema";
import { getDayName, getShortMonthName } from "@/lib/utils/date";
import { EventCard } from "./event-card";

interface WeekViewProps {
  weekStart: Date;
  events: Event[];
}

export function WeekView({ weekStart, events }: WeekViewProps) {
  // Generate 7 days starting from weekStart (Monday)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group events by day
  const eventsByDay: Record<string, Event[]> = {};
  for (const event of events) {
    const key = new Date(event.startDate).toDateString();
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(event);
  }

  const today = new Date().toDateString();

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const key = day.toDateString();
        const dayEvents = eventsByDay[key] || [];
        const isToday = key === today;

        return (
          <div key={key}>
            <div
              className={`flex items-center gap-2 py-2 ${
                isToday ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-sm font-semibold">
                {getDayName(day.getDay())}
              </span>
              <span className="text-sm">
                {getShortMonthName(day.getMonth())} {day.getDate()}
              </span>
              {isToday && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Today
                </span>
              )}
            </div>

            {dayEvents.length > 0 ? (
              <div className="space-y-2 pl-4 border-l-2 border-border ml-2">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="pl-4 border-l-2 border-border ml-2 py-3 text-sm text-muted-foreground italic">
                No events
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
