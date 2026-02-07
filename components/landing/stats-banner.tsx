import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { count, gte } from "drizzle-orm";

async function getStats() {
  try {
    const [eventCount] = await db
      .select({ count: count() })
      .from(events)
      .where(gte(events.startDate, new Date()));

    const [userCount] = await db.select({ count: count() }).from(users);

    return {
      events: eventCount?.count ?? 0,
      insiders: userCount?.count ?? 0,
    };
  } catch {
    return { events: 0, insiders: 0 };
  }
}

export async function StatsBanner() {
  const stats = await getStats();

  return (
    <section className="border-t border-b border-border bg-muted/50 py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 sm:flex-row sm:justify-center sm:gap-16">
        <Stat value={stats.events} label="upcoming events" />
        <Stat value={stats.insiders} label="insiders" />
        <Stat value="6" label="Bay Area regions" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
