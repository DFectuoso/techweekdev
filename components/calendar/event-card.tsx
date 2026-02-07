import type { Event } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/utils/date";
import { typeColors } from "@/lib/utils/event-colors";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        event.isFeatured
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{event.name}</h3>
            {event.isFeatured && (
              <Badge className="bg-primary/10 text-primary text-[10px]">
                Featured
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateRange(start, end)}
          </p>
        </div>
        {event.price && (
          <span className="shrink-0 text-sm font-medium">{event.price}</span>
        )}
      </div>

      {event.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {event.eventType && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              typeColors[event.eventType] || typeColors.other
            }`}
          >
            {event.eventType}
          </span>
        )}
        {event.region && (
          <Badge variant="outline" className="text-xs">
            {event.region}
          </Badge>
        )}
        {event.website && (
          <a
            href={event.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:underline"
          >
            Website &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
