import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventsBetween } from "@/lib/queries/events";
import type { EventType, Region } from "@/lib/db/schema";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get("type") as EventType | null;
  const region = searchParams.get("region") as Region | null;

  const now = new Date();
  const end = new Date(now.getFullYear() + 1, 11, 31);

  const events = await getEventsBetween(now, end, {
    eventType: eventType || undefined,
    region: region || undefined,
  });

  return NextResponse.json(events);
}
