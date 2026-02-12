import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findDuplicate } from "@/lib/queries/duplicates";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { events } = body as { events: { website?: string | null }[] };

  if (!Array.isArray(events)) {
    return NextResponse.json(
      { error: "events array is required" },
      { status: 400 }
    );
  }

  const results = await Promise.all(
    events.map(async (evt, index) => {
      if (!evt.website) {
        return { index, existingEvent: null };
      }

      const existing = await findDuplicate({ website: evt.website });
      if (existing) {
        return {
          index,
          existingEvent: {
            id: existing.id,
            name: existing.name,
            website: existing.website,
            startDate: existing.startDate,
          },
        };
      }

      return { index, existingEvent: null };
    })
  );

  return NextResponse.json({ results });
}
