import { db } from "@/lib/db";
import { eventSuggestions, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type {
  SuggestionStatus,
  NewEventSuggestion,
  EventSuggestion,
} from "@/lib/db/schema";

export async function getSuggestions(
  status?: SuggestionStatus
): Promise<EventSuggestion[]> {
  if (status) {
    return db
      .select()
      .from(eventSuggestions)
      .where(eq(eventSuggestions.status, status))
      .orderBy(desc(eventSuggestions.createdAt));
  }

  return db
    .select()
    .from(eventSuggestions)
    .orderBy(desc(eventSuggestions.createdAt));
}

export async function getPendingSuggestionCount(): Promise<number> {
  const rows = await db
    .select()
    .from(eventSuggestions)
    .where(eq(eventSuggestions.status, "pending"));
  return rows.length;
}

export async function getSuggestionById(
  id: string
): Promise<EventSuggestion | undefined> {
  return db.query.eventSuggestions.findFirst({
    where: eq(eventSuggestions.id, id),
  });
}

export async function createSuggestion(
  data: NewEventSuggestion
): Promise<EventSuggestion> {
  const [created] = await db
    .insert(eventSuggestions)
    .values(data)
    .returning();
  return created;
}

export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
  reviewedBy: string
): Promise<void> {
  await db
    .update(eventSuggestions)
    .set({ status, reviewedBy, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(eventSuggestions.id, id));
}

export async function approveSuggestion(
  id: string,
  reviewedBy: string
): Promise<string> {
  const suggestion = await getSuggestionById(id);
  if (!suggestion || suggestion.status !== "pending") {
    throw new Error("Suggestion not found or not pending");
  }

  // Create real event from suggestion
  const [newEvent] = await db.insert(events).values({
    name: suggestion.name,
    description: suggestion.description,
    website: suggestion.website,
    price: suggestion.price,
    startDate: suggestion.startDate,
    endDate: suggestion.endDate,
    eventType: suggestion.eventType,
    region: suggestion.region,
  }).returning();

  // Mark suggestion as approved
  await updateSuggestionStatus(id, "approved", reviewedBy);

  return newEvent.id;
}
