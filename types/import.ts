import type { EventType, Region } from "@/lib/db/schema";

export interface ExtractedEvent {
  _tempId: string;
  name: string | null;
  description: string | null;
  website: string | null;
  imageUrl: string | null;
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

// ── Import Workbench types ──────────────────────────────────────────

export type UrlJobStatus = "queued" | "processing" | "done" | "error";

export interface UrlJob {
  id: string;
  url: string;
  status: UrlJobStatus;
  eventCount: number;
  error?: string;
}

export type WorkbenchEventStatus =
  | "pending"
  | "importing"
  | "imported"
  | "rejected"
  | "error";

export interface DuplicateInfo {
  id: string;
  name: string;
  website: string | null;
  startDate: string | number | null;
}

export interface PreviousRejectionInfo {
  eventName: string | null;
  rejectedAt: number;
}

export interface WorkbenchEvent {
  event: ExtractedEvent;
  edits?: ExtractedEvent;
  sourceUrl: string;
  sourceJobId: string;
  status: WorkbenchEventStatus;
  isDuplicate: boolean;
  duplicateKind?: "exact" | "cycle";
  duplicateInfo?: DuplicateInfo;
  isPreviouslyRejected: boolean;
  previousRejection?: PreviousRejectionInfo;
  importError?: string;
}
