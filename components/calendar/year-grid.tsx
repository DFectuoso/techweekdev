"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
  computeFeaturedBarSegments,
  assignBarLanes,
  type BarSegment,
} from "@/lib/utils/year-grid-layout";
import { EventDensityIndicator } from "./event-density-indicator";

const CELL_WIDTH = 54;
const CELL_HEIGHT = 44;
const BAR_HEIGHT = 16;
const BAR_GAP = 2;
const MAX_VISIBLE_LANES = 3;

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
  const todayRef = useRef<HTMLDivElement>(null);
  const [cellsPerRow, setCellsPerRow] = useState(0);

  const parsedDates = useMemo(() => dates.map((d) => new Date(d)), [dates]);
  const today = useMemo(() => new Date(), []);

  // Measure container width → compute cellsPerRow
  const updateCellsPerRow = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const count = Math.max(1, Math.floor(width / CELL_WIDTH));
    setCellsPerRow(count);
  }, []);

  useEffect(() => {
    updateCellsPerRow();
  }, [updateCellsPerRow]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(updateCellsPerRow, 100);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [updateCellsPerRow]);

  // Auto-scroll to today on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      todayRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Chunk dates into rows
  const rows = useMemo(() => {
    if (cellsPerRow === 0) return [];
    const result: Date[][] = [];
    for (let i = 0; i < parsedDates.length; i += cellsPerRow) {
      result.push(parsedDates.slice(i, i + cellsPerRow));
    }
    return result;
  }, [parsedDates, cellsPerRow]);

  // Compute bar segments
  const segments = useMemo(() => {
    if (cellsPerRow === 0 || featuredEvents.length === 0) return [];
    const raw = computeFeaturedBarSegments(featuredEvents, parsedDates, cellsPerRow);
    return assignBarLanes(raw);
  }, [featuredEvents, parsedDates, cellsPerRow]);

  // Group segments by row, compute visible/overflow
  const segmentsByRow = useMemo(() => {
    const map = new Map<number, { visible: BarSegment[]; overflow: number }>();
    const byRow = new Map<number, BarSegment[]>();
    for (const seg of segments) {
      if (!byRow.has(seg.rowIndex)) byRow.set(seg.rowIndex, []);
      byRow.get(seg.rowIndex)!.push(seg);
    }
    for (const [ri, segs] of byRow.entries()) {
      const maxLane = Math.max(...segs.map((s) => s.lane));
      if (maxLane < MAX_VISIBLE_LANES) {
        map.set(ri, { visible: segs, overflow: 0 });
      } else {
        const visible = segs.filter((s) => s.lane < MAX_VISIBLE_LANES);
        const hidden = segs.filter((s) => s.lane >= MAX_VISIBLE_LANES);
        map.set(ri, { visible, overflow: hidden.length });
      }
    }
    return map;
  }, [segments]);

  const handleDayClick = useCallback(
    (date: Date) => {
      const weekStart = getWeekStart(date);
      router.push(`/calendar/week/${formatDateParam(weekStart)}`);
    },
    [router]
  );

  if (cellsPerRow === 0) {
    // Render an invisible container so ResizeObserver can measure
    return <div ref={containerRef} className="w-full min-h-[100px]" />;
  }

  return (
    <div ref={containerRef}>
      {rows.map((rowDates, rowIndex) => {
        const barInfo = segmentsByRow.get(rowIndex);
        const visibleBars = barInfo?.visible ?? [];
        const overflow = barInfo?.overflow ?? 0;
        const maxLane =
          visibleBars.length > 0
            ? Math.max(...visibleBars.map((s) => s.lane))
            : -1;
        const barAreaHeight =
          visibleBars.length > 0
            ? (maxLane + 1) * (BAR_HEIGHT + BAR_GAP) +
              (overflow > 0 ? 14 : 0)
            : 0;

        return (
          <div key={rowIndex}>
            {/* Day cells */}
            <div className="flex">
              {rowDates.map((date, colIndex) => {
                const globalIndex = rowIndex * cellsPerRow + colIndex;
                const dateStr = dates[globalIndex]!;
                const isToday = isSameDay(date, today);
                const isPast = isDateInPast(date);
                const isFirst = isFirstOfMonth(date);
                const count = eventCountByDate[dateStr] || 0;
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={dateStr}
                    ref={isToday ? todayRef : undefined}
                    onClick={() => handleDayClick(date)}
                    className={`flex flex-col flex-shrink-0 cursor-pointer rounded-md border border-border/40 transition-colors hover:bg-accent ${
                      isToday
                        ? "bg-primary/15 ring-1 ring-primary/40"
                        : isWeekend
                          ? "bg-black/[0.06] dark:bg-white/[0.06]"
                          : ""
                    } ${isPast && !isToday ? "opacity-50" : ""}`}
                    style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                  >
                    {/* Top line: day abbr (or month name) left, day number right */}
                    <div className="flex justify-between items-baseline px-1 pt-0.5">
                      {isFirst ? (
                        <span className="text-[9px] font-semibold leading-tight text-rose-600 dark:text-rose-400">
                          {getShortMonthName(date.getMonth())}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground leading-tight">
                          {DAY_ABBR[dayOfWeek]}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium leading-tight ${
                          isToday ? "text-primary font-bold" : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    {/* Density dots at bottom center */}
                    <div className="flex-1 flex items-end justify-center pb-0.5">
                      <EventDensityIndicator count={count} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar area — only if this row has bars */}
            {visibleBars.length > 0 && (
              <div className="relative" style={{ height: barAreaHeight }}>
                {visibleBars.map((seg, si) => {
                  const left = (seg.startCol / cellsPerRow) * 100;
                  const width =
                    ((seg.endCol - seg.startCol + 1) / cellsPerRow) * 100;
                  const top = seg.lane * (BAR_HEIGHT + BAR_GAP);

                  const roundedLeft = seg.isFirst
                    ? "rounded-l-md"
                    : "rounded-l-none";
                  const roundedRight = seg.isLast
                    ? "rounded-r-md"
                    : "rounded-r-none";

                  return (
                    <div
                      key={`${seg.event.id}-${rowIndex}-${si}`}
                      className={`absolute flex items-center overflow-hidden ${getFeaturedBarColor(seg.eventIndex)} ${roundedLeft} ${roundedRight}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: `${top}px`,
                        height: `${BAR_HEIGHT}px`,
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
                {overflow > 0 && (
                  <div
                    className="absolute text-[9px] text-muted-foreground"
                    style={{
                      left: 0,
                      top: `${MAX_VISIBLE_LANES * (BAR_HEIGHT + BAR_GAP)}px`,
                    }}
                  >
                    +{overflow} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
