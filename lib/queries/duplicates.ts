import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { normalizeUrl } from "@/lib/utils/normalize-url";
import type { Event } from "@/lib/db/schema";

export async function findDuplicate({
  website,
  excludeId,
}: {
  website: string | null | undefined;
  excludeId?: string;
}): Promise<Event | null> {
  const normalized = normalizeUrl(website);
  if (!normalized) return null;

  const conditions = [eq(events.normalizedWebsite, normalized)];
  if (excludeId) {
    conditions.push(ne(events.id, excludeId));
  }

  const match = await db.query.events.findFirst({
    where: and(...conditions),
  });

  return match ?? null;
}
