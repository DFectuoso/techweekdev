import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeekStart, getWeekEnd, formatDateRange } from "@/lib/utils/date";
import { getEventsBetween } from "@/lib/queries/events";
import { generateMarketingSummary } from "@/lib/ai/generate-marketing-summary";

export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekStart = getWeekStart(nextWeek);
  const weekEnd = getWeekEnd(nextWeek);
  const weekLabel = formatDateRange(weekStart, weekEnd);

  const events = await getEventsBetween(weekStart, weekEnd);

  try {
    const summary = await generateMarketingSummary(events, weekLabel);

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate" },
      { status: 500 }
    );
  }
}
