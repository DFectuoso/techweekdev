import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { normalizeUrl } from "@/lib/utils/normalize-url";
import { findDuplicate } from "@/lib/queries/duplicates";

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
    force,
  } = body;

  if (!name || !startDate) {
    return NextResponse.json(
      { error: "Name and start date are required" },
      { status: 400 }
    );
  }

  const normalizedWebsite = normalizeUrl(website);

  if (website && !force) {
    const existing = await findDuplicate({ website });
    if (existing) {
      return NextResponse.json(
        {
          error: "Duplicate event",
          existingEvent: {
            id: existing.id,
            name: existing.name,
            website: existing.website,
            startDate: existing.startDate,
          },
        },
        { status: 409 }
      );
    }
  }

  try {
    const [created] = await db
      .insert(events)
      .values({
        name,
        description: description || null,
        website: website || null,
        normalizedWebsite: normalizedWebsite,
        price: price || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isFeatured: !!isFeatured,
        eventType: eventType || null,
        region: region || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("UNIQUE constraint failed") ||
      message.includes("event_normalizedWebsite_unique")
    ) {
      return NextResponse.json(
        { error: "Duplicate event URL" },
        { status: 409 }
      );
    }
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
