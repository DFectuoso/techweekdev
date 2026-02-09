import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getClicksPerDay,
  getClickSummary,
  getTopEvents,
  getPageViewsPerDay,
  getPageViewSummary,
  getTopPages,
  type Period,
} from "@/lib/queries/analytics";

const VALID_PERIODS = new Set(["7d", "2w", "4w", "3m"]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = (VALID_PERIODS.has(searchParams.get("period") ?? "")
    ? searchParams.get("period")
    : "7d") as Period;

  const [clicksPerDay, clickSummary, topEvents, pageViewsPerDay, pageViewSummary, topPages] =
    await Promise.all([
      getClicksPerDay(period),
      getClickSummary(period),
      getTopEvents(period),
      getPageViewsPerDay(period),
      getPageViewSummary(period),
      getTopPages(period),
    ]);

  return NextResponse.json({
    clicksPerDay,
    clickSummary,
    topEvents,
    pageViewsPerDay,
    pageViewSummary,
    topPages,
  });
}
