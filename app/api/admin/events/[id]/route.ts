import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
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

  const [updated] = await db
    .update(events)
    .set({
      name,
      description: description || null,
      website: website || null,
      price: price || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isFeatured: !!isFeatured,
      eventType: eventType || null,
      region: region || null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  await db.delete(events).where(eq(events.id, id));

  return NextResponse.json({ success: true });
}
