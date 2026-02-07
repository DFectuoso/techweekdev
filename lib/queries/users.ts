import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getNewsletterSubscribers(): Promise<
  { id: string; email: string; name: string | null }[]
> {
  return db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.newsletterOptIn, true))
    .then((rows) => rows.filter((r): r is typeof r & { email: string } => r.email !== null));
}

export async function getUserNewsletterStatus(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ newsletterOptIn: users.newsletterOptIn })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.newsletterOptIn ?? false;
}

export async function unsubscribeUser(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ newsletterOptIn: false })
    .where(eq(users.id, userId));
}

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function toggleUserAdmin(userId: string): Promise<void> {
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");

  await db
    .update(users)
    .set({ isAdmin: !user.isAdmin })
    .where(eq(users.id, userId));
}

export async function toggleUserNewsletter(userId: string): Promise<void> {
  const [user] = await db
    .select({ newsletterOptIn: users.newsletterOptIn })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");

  await db
    .update(users)
    .set({ newsletterOptIn: !user.newsletterOptIn })
    .where(eq(users.id, userId));
}

export async function deleteUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
