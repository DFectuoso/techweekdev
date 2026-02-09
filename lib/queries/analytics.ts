import { db } from "@/lib/db";
import { eventClicks, pageViews, events } from "@/lib/db/schema";
import { sql, gte, eq, desc, count } from "drizzle-orm";

export type Period = "7d" | "2w" | "4w" | "3m";

function periodStart(period: Period): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "7d":  d.setDate(d.getDate() - 7);  break;
    case "2w":  d.setDate(d.getDate() - 14); break;
    case "4w":  d.setDate(d.getDate() - 28); break;
    case "3m":  d.setMonth(d.getMonth() - 3); break;
  }
  return d;
}

function periodDays(period: Period): number {
  switch (period) {
    case "7d":  return 7;
    case "2w":  return 14;
    case "4w":  return 28;
    case "3m":  return 90;
  }
}

// ── Click queries ──────────────────────────────────────────────────

export async function getClicksPerDay(period: Period, eventId?: string) {
  const start = periodStart(period);
  const conditions = [gte(eventClicks.clickedAt, start)];
  if (eventId) conditions.push(eq(eventClicks.eventId, eventId));

  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${eventClicks.clickedAt} / 1000, 'unixepoch')`,
      clicks: count(),
    })
    .from(eventClicks)
    .where(conditions.length > 1 ? sql`${conditions[0]} AND ${conditions[1]}` : conditions[0])
    .groupBy(sql`strftime('%Y-%m-%d', ${eventClicks.clickedAt} / 1000, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m-%d', ${eventClicks.clickedAt} / 1000, 'unixepoch')`);

  return rows;
}

export async function getClickSummary(period: Period, eventId?: string) {
  const start = periodStart(period);
  const days = periodDays(period);
  const conditions = [gte(eventClicks.clickedAt, start)];
  if (eventId) conditions.push(eq(eventClicks.eventId, eventId));

  const where = conditions.length > 1
    ? sql`${conditions[0]} AND ${conditions[1]}`
    : conditions[0]!;

  const [row] = await db
    .select({
      totalClicks: count(),
      uniqueEvents: sql<number>`COUNT(DISTINCT ${eventClicks.eventId})`,
    })
    .from(eventClicks)
    .where(where);

  const totalClicks = row?.totalClicks ?? 0;
  return {
    totalClicks,
    uniqueEvents: row?.uniqueEvents ?? 0,
    dailyAverage: Math.round((totalClicks / days) * 10) / 10,
  };
}

export async function getTopEvents(period: Period, limit = 20) {
  const start = periodStart(period);

  const rows = await db
    .select({
      eventId: eventClicks.eventId,
      eventName: events.name,
      website: events.website,
      isFeatured: events.isFeatured,
      clicks: count(),
    })
    .from(eventClicks)
    .innerJoin(events, eq(eventClicks.eventId, events.id))
    .where(gte(eventClicks.clickedAt, start))
    .groupBy(eventClicks.eventId)
    .orderBy(desc(count()))
    .limit(limit);

  return rows;
}

// ── Page view queries ──────────────────────────────────────────────

export async function getPageViewsPerDay(period: Period) {
  const start = periodStart(period);

  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${pageViews.viewedAt} / 1000, 'unixepoch')`,
      views: count(),
    })
    .from(pageViews)
    .where(gte(pageViews.viewedAt, start))
    .groupBy(sql`strftime('%Y-%m-%d', ${pageViews.viewedAt} / 1000, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m-%d', ${pageViews.viewedAt} / 1000, 'unixepoch')`);

  return rows;
}

export async function getPageViewSummary(period: Period) {
  const start = periodStart(period);
  const days = periodDays(period);

  const [row] = await db
    .select({
      totalViews: count(),
      uniqueVisitors: sql<number>`COUNT(DISTINCT ${pageViews.userId})`,
    })
    .from(pageViews)
    .where(gte(pageViews.viewedAt, start));

  const totalViews = row?.totalViews ?? 0;
  return {
    totalViews,
    uniqueVisitors: row?.uniqueVisitors ?? 0,
    dailyAverage: Math.round((totalViews / days) * 10) / 10,
  };
}

export async function getTopPages(period: Period, limit = 10) {
  const start = periodStart(period);

  const rows = await db
    .select({
      path: pageViews.path,
      views: count(),
    })
    .from(pageViews)
    .where(gte(pageViews.viewedAt, start))
    .groupBy(pageViews.path)
    .orderBy(desc(count()))
    .limit(limit);

  return rows;
}
