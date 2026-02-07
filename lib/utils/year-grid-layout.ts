import type { Event } from "@/lib/db/schema";

export interface CellMeasurement {
  index: number;
  date: Date;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VisualRow {
  rowTop: number;
  cells: CellMeasurement[];
}

export interface BarSegment {
  event: Event;
  eventIndex: number;
  rowIndex: number;
  startCellIndex: number;
  endCellIndex: number;
  isFirst: boolean;
  isLast: boolean;
  lane: number;
}

/** Group cell measurements into visual rows by their offsetTop */
export function groupCellsIntoRows(cells: CellMeasurement[]): VisualRow[] {
  const rowMap = new Map<number, CellMeasurement[]>();
  for (const cell of cells) {
    // Round to avoid subpixel differences
    const key = Math.round(cell.top);
    if (!rowMap.has(key)) rowMap.set(key, []);
    rowMap.get(key)!.push(cell);
  }
  return Array.from(rowMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([rowTop, rowCells]) => ({
      rowTop,
      cells: rowCells.sort((a, b) => a.left - b.left),
    }));
}

/** Compute which cells each featured event spans, splitting across visual rows */
export function computeFeaturedBarSegments(
  featuredEvents: Event[],
  allDates: Date[],
  rows: VisualRow[]
): BarSegment[] {
  const segments: BarSegment[] = [];

  // Build a map: dateString -> cell index in the allDates array
  const dateToIndex = new Map<string, number>();
  for (let i = 0; i < allDates.length; i++) {
    dateToIndex.set(allDates[i]!.toDateString(), i);
  }

  // Build a map: cell index -> row index
  const cellToRow = new Map<number, number>();
  for (let ri = 0; ri < rows.length; ri++) {
    for (const cell of rows[ri]!.cells) {
      cellToRow.set(cell.index, ri);
    }
  }

  for (let ei = 0; ei < featuredEvents.length; ei++) {
    const event = featuredEvents[ei]!;
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;

    // Find all cell indices this event covers
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
      const ri = cellToRow.get(ci);
      if (ri === undefined) continue;
      if (!rowGroups.has(ri)) rowGroups.set(ri, []);
      rowGroups.get(ri)!.push(ci);
    }

    const sortedRows = Array.from(rowGroups.keys()).sort((a, b) => a - b);
    for (let si = 0; si < sortedRows.length; si++) {
      const ri = sortedRows[si]!;
      const indices = rowGroups.get(ri)!.sort((a, b) => a - b);
      segments.push({
        event,
        eventIndex: ei,
        rowIndex: ri,
        startCellIndex: indices[0]!,
        endCellIndex: indices[indices.length - 1]!,
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
    // Sort by start cell index for consistent lane assignment
    rowSegs.sort((a, b) => a.startCellIndex - b.startCellIndex);
    const lanes: { end: number }[] = [];

    for (const seg of rowSegs) {
      let placed = false;
      for (let l = 0; l < lanes.length; l++) {
        if (lanes[l]!.end < seg.startCellIndex) {
          lanes[l]!.end = seg.endCellIndex;
          seg.lane = l;
          placed = true;
          break;
        }
      }
      if (!placed) {
        seg.lane = lanes.length;
        lanes.push({ end: seg.endCellIndex });
      }
    }
  }

  return segments;
}
