import { db } from "@/lib/db";
import { rejectedImportUrls } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { normalizeUrl } from "@/lib/utils/normalize-url";

export async function findRejectedUrls(urls: string[]) {
  const normalized = urls
    .map((u) => normalizeUrl(u))
    .filter((n): n is string => n !== null);

  if (normalized.length === 0) return new Map<string, { id: string; eventName: string | null; rejectedAt: Date }>();

  const rows = await db
    .select()
    .from(rejectedImportUrls)
    .where(inArray(rejectedImportUrls.normalizedUrl, normalized));

  const map = new Map<string, { id: string; eventName: string | null; rejectedAt: Date }>();
  for (const row of rows) {
    map.set(row.normalizedUrl, {
      id: row.id,
      eventName: row.eventName,
      rejectedAt: row.rejectedAt,
    });
  }
  return map;
}

export async function rejectImportUrl(url: string, eventName: string | null) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;

  await db
    .insert(rejectedImportUrls)
    .values({ url, normalizedUrl: normalized, eventName })
    .onConflictDoNothing({ target: rejectedImportUrls.normalizedUrl });
}

export async function unrejectImportUrl(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;

  await db
    .delete(rejectedImportUrls)
    .where(eq(rejectedImportUrls.normalizedUrl, normalized));
}
