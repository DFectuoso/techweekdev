import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getClicksPerDay,
  getClickSummary,
  type Period,
} from "@/lib/queries/analytics";

const VALID_PERIODS = new Set(["7d", "2w", "4w", "3m"]);

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const period = (VALID_PERIODS.has(searchParams.get("period") ?? "")
    ? searchParams.get("period")
    : "7d") as Period;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [clicksPerDay, summary] = await Promise.all([
    getClicksPerDay(period, id),
    getClickSummary(period, id),
  ]);

  return NextResponse.json({ event, clicksPerDay, summary });
}
