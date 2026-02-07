import { EVENT_TYPES, type EventType } from "@/lib/db/schema";

export function parseEventTypeFilter(typesParam?: string): EventType[] {
  if (!typesParam) return [];
  return typesParam
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is EventType =>
      EVENT_TYPES.includes(t as EventType)
    );
}
