import type { EventType, Region } from "@/lib/db/schema";

export interface ExtractedEvent {
  _tempId: string;
  name: string | null;
  description: string | null;
  website: string | null;
  price: string | null;
  startDate: string | null; // ISO 8601
  endDate: string | null; // ISO 8601
  eventType: EventType | null;
  region: Region | null;
  isFeatured: boolean;
  _confidence: number; // 0-1 from LLM
}

export interface ImportResponse {
  events: ExtractedEvent[];
  sourceUrl: string;
  pageType: "single" | "listing" | "none";
}
