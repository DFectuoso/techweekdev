import type { Event } from "@/lib/db/schema";
import { getShortMonthName } from "@/lib/utils/date";

interface FeaturedMarkerProps {
  events: Event[];
}

export function FeaturedMarker({ events }: FeaturedMarkerProps) {
  if (events.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {events.slice(0, 3).map((event) => {
        const start = new Date(event.startDate);
        const end = event.endDate ? new Date(event.endDate) : null;

        const dateStr =
          end && start.toDateString() !== end.toDateString()
            ? `${getShortMonthName(start.getMonth())} ${start.getDate()}-${end.getDate()}`
            : `${getShortMonthName(start.getMonth())} ${start.getDate()}`;

        return (
          <p
            key={event.id}
            className="truncate text-[10px] leading-tight text-primary font-medium"
            title={event.name}
          >
            {dateStr}: {event.name}
          </p>
        );
      })}
    </div>
  );
}
