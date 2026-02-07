import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.startDate));

  return NextResponse.json(allEvents);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const {
    name,
    description,
    website,
    price,
    startDate,
    endDate,
    isFeatured,
    eventType,
    region,
  } = body;

  if (!name || !startDate) {
    return NextResponse.json(
      { error: "Name and start date are required" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(events)
    .values({
      name,
      description: description || null,
      website: website || null,
      price: price || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isFeatured: !!isFeatured,
      eventType: eventType || null,
      region: region || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
