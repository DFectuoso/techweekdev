import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, or, gte, lte, eq, asc, desc, inArray, isNull, type SQL } from "drizzle-orm";
import type { EventType, Region, Event } from "@/lib/db/schema";

export async function getEventsBetween(
  start: Date,
  end: Date,
  filters?: { eventType?: EventType; region?: Region }
): Promise<Event[]> {
  const conditions: SQL[] = [
    lte(events.startDate, end),
    or(
      and(isNull(events.endDate), gte(events.startDate, start)),
      gte(events.endDate, start)
    )!,
  ];

  if (filters?.eventType) {
    conditions.push(eq(events.eventType, filters.eventType));
  }
  if (filters?.region) {
    conditions.push(eq(events.region, filters.region));
  }

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.startDate));
}

export async function getFeaturedEvents(
  start: Date,
  end: Date
): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(
      and(
        lte(events.startDate, end),
        or(
          and(isNull(events.endDate), gte(events.startDate, start)),
          gte(events.endDate, start)
        ),
        eq(events.isFeatured, true)
      )
    )
    .orderBy(asc(events.startDate));
}

export async function getEventById(id: string): Promise<Event | undefined> {
  return db.query.events.findFirst({
    where: eq(events.id, id),
  });
}

export async function getAllEvents(): Promise<Event[]> {
  return db.select().from(events).orderBy(desc(events.startDate));
}

export async function getEventsBetweenFiltered(
  start: Date,
  end: Date,
  eventTypes?: EventType[]
): Promise<Event[]> {
  const conditions: SQL[] = [
    lte(events.startDate, end),
    or(
      and(isNull(events.endDate), gte(events.startDate, start)),
      gte(events.endDate, start)
    )!,
  ];

  if (eventTypes && eventTypes.length > 0) {
    conditions.push(inArray(events.eventType, eventTypes));
  }

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.startDate));
}
