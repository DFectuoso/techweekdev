import type { Event } from "@/lib/db/schema";

export interface BarSegment {
  event: Event;
  eventIndex: number;
  rowIndex: number;
  startCol: number;
  endCol: number;
  isFirst: boolean;
  isLast: boolean;
  lane: number;
}

/** Compute which columns each featured event spans, splitting across rows */
export function computeFeaturedBarSegments(
  featuredEvents: Event[],
  allDates: Date[],
  cellsPerRow: number
): BarSegment[] {
  const segments: BarSegment[] = [];

  // Build a map: dateString -> index in allDates
  const dateToIndex = new Map<string, number>();
  for (let i = 0; i < allDates.length; i++) {
    dateToIndex.set(allDates[i]!.toDateString(), i);
  }

  for (let ei = 0; ei < featuredEvents.length; ei++) {
    const event = featuredEvents[ei]!;
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;

    // Find all date indices this event covers
    const coveredIndices: number[] = [];
    for (let i = 0; i < allDates.length; i++) {
      const d = allDates[i]!;
      if (d >= startDate && d <= endDate) {
        coveredIndices.push(i);
      } else if (
        d.toDateString() === startDate.toDateString() ||
        d.toDateString() === endDate.toDateString()
      ) {
        coveredIndices.push(i);
      }
    }

    if (coveredIndices.length === 0) continue;

    // Group covered indices by row
    const rowGroups = new Map<number, number[]>();
    for (const ci of coveredIndices) {
      const ri = Math.floor(ci / cellsPerRow);
      if (!rowGroups.has(ri)) rowGroups.set(ri, []);
      rowGroups.get(ri)!.push(ci);
    }

    const sortedRows = Array.from(rowGroups.keys()).sort((a, b) => a - b);
    for (let si = 0; si < sortedRows.length; si++) {
      const ri = sortedRows[si]!;
      const indices = rowGroups.get(ri)!.sort((a, b) => a - b);
      const startCol = indices[0]! % cellsPerRow;
      const endCol = indices[indices.length - 1]! % cellsPerRow;
      segments.push({
        event,
        eventIndex: ei,
        rowIndex: ri,
        startCol,
        endCol,
        isFirst: si === 0,
        isLast: si === sortedRows.length - 1,
        lane: 0,
      });
    }
  }

  return segments;
}

/** Assign non-overlapping vertical lanes within each row. Max 3 visible. */
export function assignBarLanes(segments: BarSegment[]): BarSegment[] {
  // Group by row
  const byRow = new Map<number, BarSegment[]>();
  for (const seg of segments) {
    if (!byRow.has(seg.rowIndex)) byRow.set(seg.rowIndex, []);
    byRow.get(seg.rowIndex)!.push(seg);
  }

  for (const rowSegs of byRow.values()) {
    // Sort by start column for consistent lane assignment
    rowSegs.sort((a, b) => a.startCol - b.startCol);
    const lanes: { end: number }[] = [];

    for (const seg of rowSegs) {
      let placed = false;
      for (let l = 0; l < lanes.length; l++) {
        if (lanes[l]!.end < seg.startCol) {
          lanes[l]!.end = seg.endCol;
          seg.lane = l;
          placed = true;
          break;
        }
      }
      if (!placed) {
        seg.lane = lanes.length;
        lanes.push({ end: seg.endCol });
      }
    }
  }

  return segments;
}
