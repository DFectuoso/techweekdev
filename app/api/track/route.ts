import { db } from "@/lib/db";
import { eventClicks, pageViews } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "click" && body.eventId) {
      await db.insert(eventClicks).values({
        eventId: body.eventId,
        source: body.source ?? "unknown",
      });
    } else if (body.type === "pageview" && body.path) {
      await db.insert(pageViews).values({
        path: body.path,
        userId: body.userId ?? null,
      });
    }
  } catch {
    // silent fail — analytics should never break the app
  }

  return new Response(null, { status: 204 });
}
