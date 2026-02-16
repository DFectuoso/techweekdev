"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EVENT_TYPES, REGIONS } from "@/lib/db/schema";
import { EditForm, confidenceColor } from "@/components/admin/import-edit-form";
import type { ExtractedEvent, WorkbenchEvent } from "@/types/import";
import { formatDateInBayArea } from "@/lib/utils/timezone";

interface ImportEventTableProps {
  events: WorkbenchEvent[];
  selected: Set<string>;
  importing: boolean;
  importProgress: number;
  onToggleSelect: (tempId: string) => void;
  onToggleAll: () => void;
  onEdit: (tempId: string, updated: ExtractedEvent) => void;
  onReject: (tempId: string) => void;
  onRestore: (tempId: string) => void;
  onImportSelected: () => void;
  onImportOne: (tempId: string) => void;
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname.replace(/\/$/, "");
    return display.length > 44 ? display.slice(0, 44) + "..." : display;
  } catch {
    return url.slice(0, 44);
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown date";
  return formatDateInBayArea(dateStr) || "Unknown date";
}

function sourceBadge(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("lu.ma")) return "Luma";
    if (hostname.includes("eventbrite")) return "Eventbrite";
    if (hostname.includes("meetup")) return "Meetup";
    return hostname.split(".")[0];
  } catch {
    return "Source";
  }
}

function buildCycleCreateUrl(wEvent: WorkbenchEvent): string {
  const evt = wEvent.edits || wEvent.event;
  const params = new URLSearchParams();
  params.set("cycle", "1");
  if (wEvent.duplicateInfo?.id) params.set("fromEventId", wEvent.duplicateInfo.id);
  if (evt.name) params.set("name", evt.name);
  if (evt.description) params.set("description", evt.description);
  if (evt.website) params.set("website", evt.website);
  if (evt.price) params.set("price", evt.price);
  if (evt.startDate) params.set("startDate", evt.startDate);
  if (evt.endDate) params.set("endDate", evt.endDate);
  if (evt.eventType) params.set("eventType", evt.eventType);
  if (evt.region) params.set("region", evt.region);
  if (evt.isFeatured) params.set("isFeatured", "1");
  return `/admin/events/new?${params.toString()}`;
}

function StatusBadge({ wEvent }: { wEvent: WorkbenchEvent }) {
  if (wEvent.status === "imported") {
    return (
      <Badge
        variant="secondary"
        className="border-green-300 bg-green-50 text-green-800"
      >
        Imported
      </Badge>
    );
  }
  if (wEvent.status === "importing") return <Badge variant="secondary">Importing...</Badge>;
  if (wEvent.status === "rejected") return <Badge variant="secondary" className="opacity-60">Rejected</Badge>;
  if (wEvent.status === "error") {
    return (
      <Badge
        variant="secondary"
        className="border-red-300 bg-red-50 text-red-800"
      >
        Error
      </Badge>
    );
  }
  if (wEvent.isDuplicate && wEvent.duplicateKind === "exact") {
    return (
      <Badge
        variant="secondary"
        className="border-yellow-300 bg-yellow-50 text-yellow-800"
      >
        Already Exists
      </Badge>
    );
  }
  if (wEvent.isDuplicate && wEvent.duplicateKind === "cycle") {
    return (
      <Badge
        variant="secondary"
        className="border-blue-300 bg-blue-50 text-blue-800"
      >
        Existing URL (Cycle)
      </Badge>
    );
  }
  if (wEvent.isPreviouslyRejected) {
    return (
      <Badge
        variant="secondary"
        className="border-amber-300 bg-amber-50 text-amber-800"
      >
        Previously Rejected
      </Badge>
    );
  }
  return <Badge variant="outline">New</Badge>;
}

export function ImportEventTable({
  events,
  selected,
  importing,
  importProgress,
  onToggleSelect,
  onToggleAll,
  onEdit,
  onReject,
  onRestore,
  onImportSelected,
  onImportOne,
}: ImportEventTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const pendingEvents = events.filter(
    (e) =>
      (e.status === "pending" || e.status === "error") &&
      !e.isDuplicate
  );
  const selectableIds = new Set(pendingEvents.map((e) => e.event._tempId));
  const allSelected =
    selectableIds.size > 0 &&
    [...selectableIds].every((id) => selected.has(id));

  const editingWEvent = editingId
    ? events.find((e) => e.event._tempId === editingId)
    : null;
  const editingEvent = editingWEvent
    ? editingWEvent.edits || editingWEvent.event
    : null;

  const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));
  const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));

  const selectedCount = selected.size;
  const importedCount = events.filter((e) => e.status === "imported").length;
  const rejectedCount = events.filter((e) => e.status === "rejected").length;

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Events will appear here as URLs are processed
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Select all reviewable
            </label>
            <span className="text-sm text-muted-foreground">{events.length} events</span>
            {importedCount > 0 && <span className="text-sm text-green-600">{importedCount} imported</span>}
            {rejectedCount > 0 && <span className="text-sm text-muted-foreground">{rejectedCount} rejected</span>}
          </div>
          <Button
            onClick={onImportSelected}
            disabled={importing || selectedCount === 0}
            className="min-w-48"
          >
            {importing
              ? `Importing (${importProgress}/${selectedCount})...`
              : `Import Selected (${selectedCount})`}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {events.map((wEvent) => {
          const evt = wEvent.edits || wEvent.event;
          const tempId = wEvent.event._tempId;
          const isExactDuplicate = wEvent.duplicateKind === "exact";
          const isCycleDuplicate = wEvent.duplicateKind === "cycle";
          const isSelectable = selectableIds.has(tempId);
          const isDimmed =
            wEvent.status === "imported" ||
            wEvent.status === "rejected" ||
            isExactDuplicate;

          return (
            <div
              key={tempId}
              className={`rounded-xl border border-border bg-card p-4 ${
                isDimmed ? "opacity-55" : ""
              }`}
            >
              <div className="flex flex-col gap-4 xl:flex-row">
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    {isSelectable ? (
                      <input
                        type="checkbox"
                        checked={selected.has(tempId)}
                        onChange={() => onToggleSelect(tempId)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    ) : (
                      <span className="block h-4 w-4" />
                    )}
                  </div>

                  <div className="w-[250px] shrink-0">
                    {evt.imageUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: evt.imageUrl!,
                            name: evt.name || "Event image",
                          })
                        }
                        className="block w-full text-left"
                        title="Click to enlarge"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evt.imageUrl}
                          alt={evt.name || "Event image"}
                          className="h-[180px] w-full rounded-lg border border-border object-contain bg-muted/20 p-1"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ) : (
                      <div className="flex h-[180px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                        No image found
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold leading-tight">
                      {evt.name || "Untitled"}
                    </h3>
                    <StatusBadge wEvent={wEvent} />
                    <span className={confidenceColor(evt._confidence)}>
                      {Math.round(evt._confidence * 100)}%
                    </span>
                  </div>

                  {evt.description && (
                    <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                      {evt.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Date:</span>{" "}
                      {formatDate(evt.startDate)}
                      {evt.endDate ? ` to ${formatDate(evt.endDate)}` : ""}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Price:</span>{" "}
                      {evt.price || "Unknown"}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Source:</span>{" "}
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {sourceBadge(wEvent.sourceUrl)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Type:</span>{" "}
                      {evt.eventType ? (
                        <Badge variant="secondary" className="ml-1">
                          {evt.eventType}
                        </Badge>
                      ) : (
                        "Unclassified"
                      )}
                      {evt.region && (
                        <Badge variant="outline" className="ml-1">
                          {evt.region}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {evt.website && (
                    <a
                      href={evt.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-primary hover:underline"
                    >
                      {truncateUrl(evt.website)}
                    </a>
                  )}

                  {wEvent.status === "error" && wEvent.importError && (
                    <p className="mt-2 text-sm text-destructive">{wEvent.importError}</p>
                  )}

                  {wEvent.duplicateInfo && (
                    <p className="mt-2 text-xs text-yellow-700">
                      {isExactDuplicate
                        ? `Exact duplicate found: ${wEvent.duplicateInfo.name}`
                        : `Same URL exists from another date: ${wEvent.duplicateInfo.name}`}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-row items-start gap-2 xl:min-w-40 xl:flex-col xl:items-stretch">
                  {wEvent.status === "pending" && !isExactDuplicate && !isCycleDuplicate && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onImportOne(tempId)}
                      >
                        Import
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(tempId)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => onReject(tempId)}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {(isCycleDuplicate || isExactDuplicate) && (
                    <>
                      {isCycleDuplicate && (
                        <a
                          href={buildCycleCreateUrl(wEvent)}
                          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Next in cycle
                        </a>
                      )}
                      {wEvent.duplicateInfo?.id && (
                        <a
                          href={`/admin/events/${wEvent.duplicateInfo.id}/edit`}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                          View existing
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(tempId)}
                      >
                        Edit draft
                      </Button>
                    </>
                  )}

                  {wEvent.status === "error" && !isExactDuplicate && !isCycleDuplicate && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onImportOne(tempId)}
                      >
                        Retry Import
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(tempId)}
                      >
                        Edit
                      </Button>
                    </>
                  )}

                  {wEvent.status === "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(tempId)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit Event"
      >
        {editingEvent && (
          <EditForm
            event={editingEvent}
            typeOptions={typeOptions}
            regionOptions={regionOptions}
            onSave={(updated) => {
              onEdit(editingId!, updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.name || "Image Preview"}
      >
        {previewImage && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[80vh] w-full rounded object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
