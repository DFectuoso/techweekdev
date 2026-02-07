import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getNewsletterSubscribers(): Promise<
  { id: string; email: string; name: string | null }[]
> {
  return db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.newsletterOptIn, true))
    .then((rows) => rows.filter((r): r is typeof r & { email: string } => r.email !== null));
}

export async function unsubscribeUser(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ newsletterOptIn: false })
    .where(eq(users.id, userId));
}
