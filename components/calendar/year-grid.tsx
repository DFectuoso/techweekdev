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

const CELL_WIDTH = 58;
const CELL_HEIGHT = 92;
const BAR_HEIGHT = 20;
const BAR_GAP = 2;
const MAX_VISIBLE_LANES = 2;
const BAR_BOTTOM_OFFSET = 26; // space for density indicator below bars

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

  // Split dates into per-year groups
  type YearGroup = {
    year: number;
    dates: Date[];
    rows: Date[][];
    segmentsByRow: Map<number, { visible: BarSegment[]; overflow: number }>;
  };

  const yearGroups = useMemo<YearGroup[]>(() => {
    if (cellsPerRow === 0) return [];

    // Split dates by year
    const groups: { year: number; dates: Date[] }[] = [];
    let currentYear = -1;
    for (const date of parsedDates) {
      const y = date.getFullYear();
      if (y !== currentYear) {
        groups.push({ year: y, dates: [] });
        currentYear = y;
      }
      groups[groups.length - 1]!.dates.push(date);
    }

    // For each group, compute rows and bar segments
    return groups.map((group) => {
      // Chunk into rows
      const rows: Date[][] = [];
      for (let i = 0; i < group.dates.length; i += cellsPerRow) {
        rows.push(group.dates.slice(i, i + cellsPerRow));
      }

      // Compute bar segments scoped to this group's dates
      let segments: BarSegment[] = [];
      if (featuredEvents.length > 0) {
        const raw = computeFeaturedBarSegments(featuredEvents, group.dates, cellsPerRow);
        segments = assignBarLanes(raw);
      }

      // Group segments by row
      const segmentsByRow = new Map<number, { visible: BarSegment[]; overflow: number }>();
      const byRow = new Map<number, BarSegment[]>();
      for (const seg of segments) {
        if (!byRow.has(seg.rowIndex)) byRow.set(seg.rowIndex, []);
        byRow.get(seg.rowIndex)!.push(seg);
      }
      for (const [ri, segs] of byRow.entries()) {
        const maxLane = Math.max(...segs.map((s) => s.lane));
        if (maxLane < MAX_VISIBLE_LANES) {
          segmentsByRow.set(ri, { visible: segs, overflow: 0 });
        } else {
          const visible = segs.filter((s) => s.lane < MAX_VISIBLE_LANES);
          const hidden = segs.filter((s) => s.lane >= MAX_VISIBLE_LANES);
          segmentsByRow.set(ri, { visible, overflow: hidden.length });
        }
      }

      return { year: group.year, dates: group.dates, rows, segmentsByRow };
    });
  }, [parsedDates, cellsPerRow, featuredEvents]);

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
      {yearGroups.map((group, groupIndex) => (
        <div key={group.year}>
          {/* Year label for 2nd+ groups */}
          {groupIndex > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-2xl font-bold">{group.year}</span>
            </div>
          )}
          {group.rows.map((rowDates, rowIndex) => {
            const barInfo = group.segmentsByRow.get(rowIndex);
            const visibleBars = barInfo?.visible ?? [];

            return (
              <div key={rowIndex} className="relative">
                {/* Day cells */}
                <div className="flex">
                  {rowDates.map((date) => {
                    const dateStr = formatDateParam(date);
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
                        } ${isPast && !isToday ? "opacity-50" : ""} ${isFirst ? "border-l-[3px] border-l-muted-foreground/60" : ""}`}
                        style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                      >
                        {/* Top line: day abbr (or month name) left, day number right */}
                        <div className={`flex justify-between items-baseline ${isFirst ? "pl-0 pr-1" : "px-1"} pt-0.5`}>
                          {isFirst ? (
                            <span className="text-[10px] font-bold leading-tight uppercase bg-muted-foreground/70 text-white px-0.5 py-[1px] rounded-r-sm">
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
                        {/* Event count — sits at bottom, featured bars overlay it */}
                        <div className="flex-1 flex items-end justify-center pb-1">
                          <EventDensityIndicator count={count} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Featured bars overlaid at bottom of cells */}
                {visibleBars.map((seg, si) => {
                  const left = seg.startCol * CELL_WIDTH;
                  const width = (seg.endCol - seg.startCol + 1) * CELL_WIDTH;
                  const bottom = BAR_BOTTOM_OFFSET + seg.lane * (BAR_HEIGHT + BAR_GAP);
                  const barColor = getFeaturedBarColor(seg.eventIndex);

                  const roundedLeft = seg.isFirst
                    ? "rounded-l-md"
                    : "rounded-l-none";
                  const roundedRight = seg.isLast
                    ? "rounded-r-md"
                    : "rounded-r-none";

                  const barClass = `group absolute z-10 flex items-center overflow-hidden hover:overflow-visible hover:z-20 ${barColor} ${roundedLeft} ${roundedRight}`;
                  const barStyle = {
                    left: `${left}px`,
                    width: `${width}px`,
                    bottom: `${bottom}px`,
                    height: `${BAR_HEIGHT}px`,
                  };
                  const label = seg.isFirst ? (
                    <span className={`whitespace-nowrap px-1.5 text-[10px] italic text-foreground/70 ${barColor} group-hover:pr-2 group-hover:rounded-r-md`}>
                      {seg.event.name}
                    </span>
                  ) : null;

                  return seg.event.website ? (
                    <a
                      key={`${seg.event.id}-${group.year}-${rowIndex}-${si}`}
                      href={seg.event.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`${barClass} hover:opacity-90 transition-opacity`}
                      style={barStyle}
                    >
                      {label}
                    </a>
                  ) : (
                    <div
                      key={`${seg.event.id}-${group.year}-${rowIndex}-${si}`}
                      className={barClass}
                      style={barStyle}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
