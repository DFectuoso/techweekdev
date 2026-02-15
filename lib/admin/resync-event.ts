"use client";

import type { Event } from "@/lib/db/schema";
import { normalizeUrl } from "@/lib/utils/normalize-url";
import type { ExtractedEvent, ImportResponse } from "@/types/import";

function toIso(value: string | number | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function pickBestImportedEvent(
  imported: ExtractedEvent[],
  sourceUrl: string,
  currentName: string
): ExtractedEvent | null {
  if (imported.length === 0) return null;
  if (imported.length === 1) return imported[0];

  const normalizedSource = normalizeUrl(sourceUrl);
  if (normalizedSource) {
    const websiteMatch = imported.find(
      (evt) => evt.website && normalizeUrl(evt.website) === normalizedSource
    );
    if (websiteMatch) return websiteMatch;
  }

  const lowerName = currentName.trim().toLowerCase();
  if (lowerName) {
    const nameMatch = imported.find(
      (evt) => typeof evt.name === "string" && evt.name.trim().toLowerCase() === lowerName
    );
    if (nameMatch) return nameMatch;
  }

  return imported[0];
}

function buildUpdatePayload(event: Event, extracted: ExtractedEvent, sourceUrl: string) {
  const fallbackStart = toIso(event.startDate);
  if (!extracted.startDate && !fallbackStart) {
    throw new Error("Imported event is missing a valid start date");
  }

  const website = extracted.website || sourceUrl || event.website || null;
  return {
    name: extracted.name || event.name,
    description: extracted.description ?? event.description ?? null,
    website,
    price: extracted.price ?? event.price ?? null,
    startDate: extracted.startDate || fallbackStart!,
    endDate: extracted.endDate ?? toIso(event.endDate),
    isFeatured: event.isFeatured,
    eventType: extracted.eventType ?? event.eventType ?? null,
    region: extracted.region ?? event.region ?? null,
  };
}

export async function resyncEventFromUrl(event: Event): Promise<Event> {
  if (!event.website) {
    throw new Error("Event has no website URL to resync from");
  }

  const importRes = await fetch("/api/admin/events/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: event.website }),
  });

  const importData: unknown = await importRes.json();
  if (!importRes.ok) {
    const message =
      typeof importData === "object" &&
      importData !== null &&
      "error" in importData &&
      typeof importData.error === "string"
        ? importData.error
        : "Failed to import event from URL";
    throw new Error(message);
  }
  const importPayload = importData as ImportResponse;

  const extracted = pickBestImportedEvent(
    importPayload.events,
    event.website,
    event.name
  );
  if (!extracted) {
    throw new Error("No events found at URL");
  }

  const updatePayload = buildUpdatePayload(event, extracted, event.website);

  const updateRes = await fetch(`/api/admin/events/${event.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatePayload),
  });

  const updateData: unknown = await updateRes.json();
  if (!updateRes.ok) {
    const message =
      typeof updateData === "object" &&
      updateData !== null &&
      "error" in updateData &&
      typeof updateData.error === "string"
        ? updateData.error
        : "Failed to update event";
    throw new Error(message);
  }

  return updateData as Event;
}
