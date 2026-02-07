"use client";

import type { Event } from "@/lib/db/schema";
import { typeColors } from "@/lib/utils/event-colors";

interface WeekEventCardProps {
  event: Event;
}

export function WeekEventCard({ event }: WeekEventCardProps) {
  const start = new Date(event.startDate);
  const hours = start.getHours();
  const minutes = start.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const timeStr = `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`;

  const className = `block w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent/50 ${
    event.isFeatured
      ? "border-primary/50 bg-primary/5"
      : "border-border bg-card"
  }`;

  const content = (
    <>
      <h4 className="text-sm font-semibold line-clamp-2">{event.name}</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">{timeStr}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {event.eventType && (
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${
              typeColors[event.eventType] || typeColors.other
            }`}
          >
            {event.eventType}
          </span>
        )}
        {event.price && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {event.price}
          </span>
        )}
      </div>
    </>
  );

  if (event.website) {
    return (
      <a
        href={event.website}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
