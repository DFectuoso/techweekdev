"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/schema";
import {
  formatDateParam,
  getWeekStart,
  getShortMonthName,
  isSameDay,
  isDateInPast,
  isFirstOfMonth,
} from "@/lib/utils/date";
import { getFeaturedBarColor } from "@/lib/utils/event-colors";
import {
  groupCellsIntoRows,
  computeFeaturedBarSegments,
  assignBarLanes,
  type CellMeasurement,
  type VisualRow,
  type BarSegment,
} from "@/lib/utils/year-grid-layout";
import { EventDensityIndicator } from "./event-density-indicator";

const MONTH_PILL_COLORS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200",
  "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-200",
];

const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface YearGridProps {
  dates: string[]; // ISO date strings
  eventCountByDate: Record<string, number>;
  featuredEvents: Event[];
}

export function YearGrid({
  dates,
  eventCountByDate,
  featuredEvents,
}: YearGridProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const todayRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<VisualRow[]>([]);
  const [segments, setSegments] = useState<BarSegment[]>([]);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const parsedDates = dates.map((d) => new Date(d));
  const today = new Date();

  const measureAndLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    setContainerRect(cRect);

    const measurements: CellMeasurement[] = [];
    for (let i = 0; i < cellRefs.current.length; i++) {
      const el = cellRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      measurements.push({
        index: i,
        date: parsedDates[i]!,
        left: rect.left - cRect.left,
        top: rect.top - cRect.top,
        width: rect.width,
        height: rect.height,
      });
    }

    const newRows = groupCellsIntoRows(measurements);
    setRows(newRows);

    if (featuredEvents.length > 0) {
      const rawSegments = computeFeaturedBarSegments(
        featuredEvents,
        parsedDates,
        newRows
      );
      const laned = assignBarLanes(rawSegments);
      setSegments(laned);
    } else {
      setSegments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, featuredEvents]);

  useEffect(() => {
    // Initial measurement after render
    const timer = setTimeout(measureAndLayout, 50);
    return () => clearTimeout(timer);
  }, [measureAndLayout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(measureAndLayout, 100);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [measureAndLayout]);

  // Auto-scroll to today on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      todayRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDayClick = (date: Date) => {
    const weekStart = getWeekStart(date);
    router.push(`/calendar/week/${formatDateParam(weekStart)}`);
  };

  // Build bar position data from segments + measurements
  const cellMap = new Map<number, CellMeasurement>();
  for (const row of rows) {
    for (const cell of row.cells) {
      cellMap.set(cell.index, cell);
    }
  }

  // Group segments by row for rendering
  const segmentsByRow = new Map<number, BarSegment[]>();
  for (const seg of segments) {
    if (!segmentsByRow.has(seg.rowIndex)) segmentsByRow.set(seg.rowIndex, []);
    segmentsByRow.get(seg.rowIndex)!.push(seg);
  }

  // Compute per-row bar area height and "+N more" overflow
  const rowBarInfo = new Map<
    number,
    { visibleSegments: BarSegment[]; overflow: number }
  >();
  for (const [ri, segs] of segmentsByRow.entries()) {
    const maxLane = Math.max(...segs.map((s) => s.lane));
    if (maxLane <= 2) {
      rowBarInfo.set(ri, { visibleSegments: segs, overflow: 0 });
    } else {
      const visible = segs.filter((s) => s.lane < 3);
      const hidden = segs.filter((s) => s.lane >= 3);
      rowBarInfo.set(ri, { visibleSegments: visible, overflow: hidden.length });
    }
  }

  return (
    <div ref={containerRef} className="relative" style={{ position: "relative" }}>
      <div className="flex flex-wrap">
        {parsedDates.map((date, i) => {
          const dateStr = date.toDateString();
          const isToday = isSameDay(date, today);
          const isPast = isDateInPast(date);
          const isFirst = isFirstOfMonth(date);
          const count = eventCountByDate[dates[i]!] || 0;
          const monthIndex = date.getMonth();

          return (
            <div
              key={dates[i]}
              ref={(el) => {
                cellRefs.current[i] = el;
                if (isToday && el) {
                  (todayRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }
              }}
              onClick={() => handleDayClick(date)}
              className={`flex w-[54px] h-[54px] flex-shrink-0 flex-col items-center justify-center cursor-pointer rounded-md transition-colors hover:bg-accent ${
                isToday
                  ? "bg-primary/15 ring-1 ring-primary/40"
                  : ""
              } ${isPast && !isToday ? "opacity-50" : ""}`}
            >
              {isFirst ? (
                <span
                  className={`rounded-full px-1.5 py-0 text-[9px] font-semibold leading-tight ${MONTH_PILL_COLORS[monthIndex]}`}
                >
                  {getShortMonthName(monthIndex)}
                </span>
              ) : (
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {DAY_ABBR[date.getDay()]}
                </span>
              )}
              <span
                className={`text-xs font-medium leading-tight ${
                  isToday ? "text-primary font-bold" : ""
                }`}
              >
                {date.getDate()}
              </span>
              <EventDensityIndicator count={count} />
            </div>
          );
        })}
      </div>

      {/* Featured event bars overlay */}
      {containerRect &&
        rows.map((row, ri) => {
          const info = rowBarInfo.get(ri);
          if (!info || info.visibleSegments.length === 0) return null;

          const barHeight = 16;
          const barGap = 2;
          const barAreaTop = row.rowTop + (row.cells[0]?.height || 54) + 2;

          return (
            <div key={`bars-${ri}`}>
              {info.visibleSegments.map((seg, si) => {
                const startCell = cellMap.get(seg.startCellIndex);
                const endCell = cellMap.get(seg.endCellIndex);
                if (!startCell || !endCell) return null;

                const left = startCell.left;
                const width = endCell.left + endCell.width - startCell.left;
                const top = barAreaTop + seg.lane * (barHeight + barGap);

                const roundedLeft = seg.isFirst
                  ? "rounded-l-md"
                  : "rounded-l-none";
                const roundedRight = seg.isLast
                  ? "rounded-r-md"
                  : "rounded-r-none";

                return (
                  <div
                    key={`${seg.event.id}-${ri}-${si}`}
                    className={`absolute flex items-center overflow-hidden ${getFeaturedBarColor(seg.eventIndex)} ${roundedLeft} ${roundedRight}`}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${barHeight}px`,
                    }}
                  >
                    {seg.isFirst && (
                      <span className="truncate px-1.5 text-[10px] italic text-foreground/70">
                        {seg.event.name}
                      </span>
                    )}
                  </div>
                );
              })}
              {info.overflow > 0 && (
                <div
                  className="absolute text-[9px] text-muted-foreground"
                  style={{
                    left: `${row.cells[0]?.left || 0}px`,
                    top: `${barAreaTop + 3 * (barHeight + barGap)}px`,
                  }}
                >
                  +{info.overflow} more
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
