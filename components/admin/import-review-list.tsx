"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EVENT_TYPES, REGIONS } from "@/lib/db/schema";
import { EditForm, confidenceColor } from "@/components/admin/import-edit-form";
import type { ExtractedEvent } from "@/types/import";

interface ImportReviewListProps {
  events: ExtractedEvent[];
  sourceUrl: string;
  onReset: () => void;
}

interface DuplicateInfo {
  id: string;
  name: string;
  website: string | null;
  startDate: string | number | null;
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname.replace(/\/$/, "");
    return display.length > 30 ? display.slice(0, 30) + "…" : display;
  } catch {
    return url.slice(0, 30);
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  // Parse naive datetime string directly to avoid timezone shift
  const [datePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function ImportReviewList({
  events,
  sourceUrl,
  onReset,
}: ImportReviewListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(events.map((e) => e._tempId))
  );
  const [edits, setEdits] = useState<Map<string, ExtractedEvent>>(
    () => new Map()
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<Map<string, DuplicateInfo>>(
    () => new Map()
  );
  const [checking, setChecking] = useState(false);

  // Pre-check for duplicates on mount
  useEffect(() => {
    async function checkDuplicates() {
      const eventsWithUrls = events.filter((e) => e.website);
      if (eventsWithUrls.length === 0) return;

      setChecking(true);
      try {
        const res = await fetch("/api/admin/events/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: events.map((e) => ({ website: e.website })),
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const dupeMap = new Map<string, DuplicateInfo>();
        const toDeselect = new Set<string>();

        for (const result of data.results) {
          if (result.existingEvent) {
            const evt = events[result.index];
            if (evt) {
              dupeMap.set(evt._tempId, result.existingEvent);
              toDeselect.add(evt._tempId);
            }
          }
        }

        setDuplicates(dupeMap);

        // Auto-deselect duplicates
        if (toDeselect.size > 0) {
          setSelected((prev) => {
            const next = new Set(prev);
            for (const id of toDeselect) {
              next.delete(id);
            }
            return next;
          });
        }
      } finally {
        setChecking(false);
      }
    }

    checkDuplicates();
  }, [events]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === events.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map((e) => e._tempId)));
    }
  }

  function getEvent(id: string): ExtractedEvent {
    return edits.get(id) || events.find((e) => e._tempId === id)!;
  }

  function saveEdit(updated: ExtractedEvent) {
    setEdits((prev) => new Map(prev).set(updated._tempId, updated));
    setEditingId(null);
  }

  async function handleImport() {
    const toImport = events
      .filter((e) => selected.has(e._tempId))
      .map((e) => getEvent(e._tempId));

    if (toImport.length === 0) return;

    setImporting(true);
    setError("");
    setProgress(0);

    for (let i = 0; i < toImport.length; i++) {
      const evt = toImport[i];
      const isDuplicate = duplicates.has(evt._tempId);
      const body: Record<string, unknown> = {
        name: evt.name,
        description: evt.description,
        website: evt.website,
        price: evt.price,
        startDate: evt.startDate,
        endDate: evt.endDate,
        isFeatured: evt.isFeatured,
        eventType: evt.eventType,
        region: evt.region,
      };

      // If this event was flagged as duplicate but kept selected, force it
      if (isDuplicate) {
        body.force = true;
      }

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(`Failed to import "${evt.name}": ${data.error || "Unknown error"}`);
        setImporting(false);
        return;
      }

      setProgress(i + 1);
    }

    router.push("/admin/events");
    router.refresh();
  }

  const editingEvent = editingId ? getEvent(editingId) : null;
  const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));
  const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Source: {sourceUrl}</Badge>
          <span className="text-sm text-muted-foreground">
            {events.length} events found
          </span>
          {duplicates.size > 0 && (
            <span className="text-sm text-yellow-600">
              {duplicates.size} duplicate{duplicates.size !== 1 ? "s" : ""} found
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {checking && (
            <span className="text-sm text-muted-foreground">
              Checking for duplicates...
            </span>
          )}
          {importing && (
            <span className="text-sm text-muted-foreground">
              Importing {progress}/{selected.size}...
            </span>
          )}
          <Button
            onClick={handleImport}
            disabled={importing || checking || selected.size === 0}
          >
            {importing
              ? `Importing (${progress}/${selected.size})...`
              : `Import Selected (${selected.size})`}
          </Button>
          <Button variant="outline" onClick={onReset} disabled={importing}>
            Start Over
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selected.size === events.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
              </th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">URL</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Confidence</th>
              <th className="p-3 text-left w-16"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((raw) => {
              const evt = getEvent(raw._tempId);
              const dupeInfo = duplicates.get(raw._tempId);
              return (
                <tr
                  key={raw._tempId}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(raw._tempId)}
                      onChange={() => toggleSelect(raw._tempId)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  </td>
                  <td className="p-3 font-medium">{evt.name || "Untitled"}</td>
                  <td className="p-3 text-muted-foreground">
                    {evt.website ? (
                      <a
                        href={evt.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {truncateUrl(evt.website)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(evt.startDate)}
                  </td>
                  <td className="p-3">
                    {evt.eventType && (
                      <Badge variant="secondary">{evt.eventType}</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {evt.price || "—"}
                  </td>
                  <td className="p-3">
                    {dupeInfo ? (
                      <Badge
                        variant="secondary"
                        className="border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
                      >
                        Already exists
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">New</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={confidenceColor(evt._confidence)}>
                      {Math.round(evt._confidence * 100)}%
                    </span>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(raw._tempId)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
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
            onSave={saveEdit}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

