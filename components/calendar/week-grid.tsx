"use client";

import type { Event } from "@/lib/db/schema";
import {
  getDayName,
  getShortMonthName,
  isSameDay,
  isDateInPast,
  parseDateParam,
} from "@/lib/utils/date";
import { getFeaturedBarColor } from "@/lib/utils/event-colors";
import { WeekEventCard } from "./week-event-card";

interface WeekGridProps {
  weekStartParam: string;
  events: Event[];
  featuredEvents: Event[];
}

export function WeekGrid({ weekStartParam, events, featuredEvents }: WeekGridProps) {
  const weekStart = parseDateParam(weekStartParam);
  const today = new Date();

  // Generate 7 days starting from weekStart
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group events by day, distributing multi-day events across all days they span
  const eventsByDay: Record<string, Event[]> = {};
  const weekEnd = days[6]!;
  for (const event of events) {
    const es = new Date(event.startDate);
    const ee = event.endDate ? new Date(event.endDate) : es;
    // Normalize to midnight for day-level comparison
    const startDay = new Date(es.getFullYear(), es.getMonth(), es.getDate());
    const endDay = new Date(ee.getFullYear(), ee.getMonth(), ee.getDate());
    // Clamp to visible week range
    const effectiveStart = startDay > days[0]! ? startDay : days[0]!;
    const effectiveEnd = endDay < weekEnd ? endDay : weekEnd;
    // Add event to each day it covers within the week
    for (const day of days) {
      if (day >= effectiveStart && day <= effectiveEnd) {
        const key = day.toDateString();
        if (!eventsByDay[key]) eventsByDay[key] = [];
        eventsByDay[key]!.push(event);
      }
    }
  }

  // Sort each day's events by start time
  for (const key of Object.keys(eventsByDay)) {
    eventsByDay[key]!.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  // Compute featured bar spans
  const featuredBars = featuredEvents.map((event, idx) => {
    const es = new Date(event.startDate);
    const ee = event.endDate ? new Date(event.endDate) : es;
    // Normalize to midnight so time-of-day doesn't skew day-level comparisons
    const startDay = new Date(es.getFullYear(), es.getMonth(), es.getDate());
    const endDay = new Date(ee.getFullYear(), ee.getMonth(), ee.getDate());

    let startCol = -1;
    let endCol = -1;
    for (let i = 0; i < 7; i++) {
      const day = days[i]!;
      if (day >= startDay && day <= endDay) {
        if (startCol === -1) startCol = i;
        endCol = i;
      }
      if (day > endDay) break;
    }

    return { event, idx, startCol, endCol };
  }).filter((b) => b.startCol !== -1 && b.endCol !== -1);

  // Simple lane assignment for featured bars
  const lanes: { end: number }[] = [];
  for (const bar of featuredBars) {
    let placed = false;
    for (let l = 0; l < lanes.length; l++) {
      if (lanes[l]!.end < bar.startCol) {
        lanes[l]!.end = bar.endCol;
        (bar as typeof bar & { lane: number }).lane = l;
        placed = true;
        break;
      }
    }
    if (!placed) {
      (bar as typeof bar & { lane: number }).lane = lanes.length;
      lanes.push({ end: bar.endCol });
    }
  }

  const barHeight = 24;
  const barGap = 4;
  const featuredAreaHeight =
    featuredBars.length > 0
      ? Math.min(lanes.length, 3) * (barHeight + barGap) + 8
      : 0;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Featured bars area */}
        {featuredBars.length > 0 && (
          <div
            className="relative mb-2"
            style={{ height: `${featuredAreaHeight}px` }}
          >
            {featuredBars.map((bar) => {
              const lane = (bar as typeof bar & { lane: number }).lane;
              if (lane >= 3) return null;

              const leftPct = (bar.startCol / 7) * 100;
              const widthPct = ((bar.endCol - bar.startCol + 1) / 7) * 100;
              const top = lane * (barHeight + barGap);

              const barColor = getFeaturedBarColor(bar.idx);
              const barClass = `group absolute z-10 flex items-center overflow-hidden hover:overflow-visible hover:z-20 ${barColor}`;
              const barStyle = {
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                top: `${top}px`,
                height: `${barHeight}px`,
              };
              const label = (
                <span className={`whitespace-nowrap h-full flex items-center px-2 text-xs font-bold text-foreground/80 ${barColor} group-hover:pr-3`}>
                  {bar.event.name}
                </span>
              );

              return bar.event.website ? (
                <a
                  key={bar.event.id}
                  href={bar.event.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${barClass} hover:opacity-90 transition-opacity`}
                  style={barStyle}
                >
                  {label}
                </a>
              ) : (
                <div
                  key={bar.event.id}
                  className={barClass}
                  style={barStyle}
                >
                  {label}
                </div>
              );
            })}
          </div>
        )}

        {/* Column headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={`px-2 py-2 text-center ${
                  isToday ? "bg-primary/10" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">
                  {getDayName(day.getDay())}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    isToday
                      ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {getShortMonthName(day.getMonth())}
                </p>
              </div>
            );
          })}
        </div>

        {/* Day columns with events */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {days.map((day, i) => {
            const key = day.toDateString();
            const dayEvents = eventsByDay[key] || [];
            const isToday = isSameDay(day, today);
            const isPast = isDateInPast(day);

            return (
              <div
                key={i}
                className={`border-r border-border last:border-r-0 p-1.5 space-y-1.5 ${
                  isToday ? "bg-primary/5" : ""
                } ${isPast && !isToday ? "opacity-30" : ""}`}
              >
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <WeekEventCard
                      key={event.id}
                      event={event}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-muted-foreground italic">
                    No events
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
