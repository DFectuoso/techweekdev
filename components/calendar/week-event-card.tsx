"use client";

import type { Event } from "@/lib/db/schema";
import { typeColors } from "@/lib/utils/event-colors";
import { trackEventClick } from "@/lib/utils/track";

interface WeekEventCardProps {
  event: Event;
  previewMode?: boolean;
}

export function WeekEventCard({ event, previewMode = false }: WeekEventCardProps) {
  const start = new Date(event.startDate);
  const hours = start.getHours();
  const minutes = start.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const timeStr = `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`;

  const className = `block w-full text-left border p-3 transition-colors hover:bg-accent/50 ${
    event.isFeatured
      ? "border-primary/60 bg-primary/10"
      : "border-border bg-card"
  }`;

  if (previewMode) {
    return (
      <div className={className} aria-hidden="true">
        <div className="h-3 w-4/5 rounded bg-foreground/15" />
        <div className="mt-2 h-2.5 w-1/3 rounded bg-foreground/10" />
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex h-4 w-14 rounded-full bg-foreground/12" />
          <span className="inline-flex h-3 w-10 rounded bg-foreground/10" />
        </div>
      </div>
    );
  }

  const content = (
    <>
      <h4 className={`text-sm line-clamp-2 ${event.isFeatured ? "font-bold" : "font-semibold"}`}>{event.name}</h4>
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
        onClick={() => trackEventClick(event.id, "week-card")}
        className={className}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
