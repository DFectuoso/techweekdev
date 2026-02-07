import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { count, gte, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const [totalEvents] = await db.select({ count: count() }).from(events);
  const [futureEvents] = await db
    .select({ count: count() })
    .from(events)
    .where(gte(events.startDate, now));
  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [newsletterSubs] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.newsletterOptIn, true));

  return NextResponse.json({
    totalEvents: totalEvents?.count ?? 0,
    futureEvents: futureEvents?.count ?? 0,
    totalUsers: totalUsers?.count ?? 0,
    newsletterSubs: newsletterSubs?.count ?? 0,
  });
}
