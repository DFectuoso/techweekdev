import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findDuplicate } from "@/lib/queries/duplicates";
import { findRejectedUrls } from "@/lib/queries/rejected-imports";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { events } = body as {
    events: { website?: string | null; startDate?: string | null }[];
  };

  if (!Array.isArray(events)) {
    return NextResponse.json(
      { error: "events array is required" },
      { status: 400 }
    );
  }

  // Collect all URLs for a single batch rejection lookup
  const allUrls = events
    .map((e) => e.website)
    .filter((w): w is string => !!w);
  const rejectedMap = await findRejectedUrls(allUrls);

  const { normalizeUrl } = await import("@/lib/utils/normalize-url");

  const results = await Promise.all(
    events.map(async (evt, index) => {
      if (!evt.website) {
        return { index, existingEvent: null, rejectedImport: null };
      }

      const existing = await findDuplicate({ website: evt.website });
      const normalized = normalizeUrl(evt.website);
      const rejection = normalized ? rejectedMap.get(normalized) : null;

      return {
        index,
        existingEvent: existing
          ? {
              id: existing.id,
              name: existing.name,
              website: existing.website,
              startDate: existing.startDate,
            }
          : null,
        rejectedImport: rejection
          ? {
              eventName: rejection.eventName,
              rejectedAt: rejection.rejectedAt.getTime(),
            }
          : null,
      };
    })
  );

  return NextResponse.json({ results });
}
