import { config } from "dotenv";
config({ path: ".env" });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { normalizeUrl } from "../lib/utils/normalize-url";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function main() {
  const allEvents = await db.select().from(schema.events);
  let updated = 0;
  let skipped = 0;

  for (const event of allEvents) {
    if (!event.website) {
      skipped++;
      continue;
    }

    const normalized = normalizeUrl(event.website);
    if (!normalized) {
      skipped++;
      continue;
    }

    if (event.normalizedWebsite === normalized) {
      skipped++;
      continue;
    }

    try {
      await db
        .update(schema.events)
        .set({ normalizedWebsite: normalized })
        .where(eq(schema.events.id, event.id));
      updated++;
      console.log(`Updated: ${event.name} → ${normalized}`);
    } catch (err) {
      // Unique constraint violation — a duplicate already exists
      console.warn(
        `DUPLICATE: "${event.name}" (${event.website}) conflicts with an existing normalized URL: ${normalized}`
      );
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
