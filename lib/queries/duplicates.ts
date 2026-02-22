import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { normalizeUrlCandidates } from "@/lib/utils/normalize-url";
import type { Event } from "@/lib/db/schema";

export async function findDuplicate({
  website,
  excludeId,
}: {
  website: string | null | undefined;
  excludeId?: string;
}): Promise<Event | null> {
  const candidates = normalizeUrlCandidates(website);
  if (candidates.length === 0) return null;

  const urlCondition =
    candidates.length === 1
      ? eq(events.normalizedWebsite, candidates[0]!)
      : inArray(events.normalizedWebsite, candidates);
  const conditions = [urlCondition];
  if (excludeId) {
    conditions.push(ne(events.id, excludeId));
  }

  const match = await db.query.events.findFirst({
    where: and(...conditions),
  });

  return match ?? null;
}
