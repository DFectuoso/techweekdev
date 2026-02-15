"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ImportUrlInput } from "@/components/admin/import-url-input";
import { ImportJobList } from "@/components/admin/import-job-list";
import { ImportEventTable } from "@/components/admin/import-event-table";
import { normalizeUrl } from "@/lib/utils/normalize-url";
import { dateKeyInBayArea } from "@/lib/utils/timezone";
import type {
  UrlJob,
  WorkbenchEvent,
  ExtractedEvent,
  ImportResponse,
  DuplicateInfo,
  PreviousRejectionInfo,
} from "@/types/import";

const MAX_CONCURRENT = 3;

function dateKeyFromInput(value: string | number | null | undefined): string | null {
  return dateKeyInBayArea(value);
}

export default function ImportWorkbench() {
  const [jobs, setJobs] = useState<UrlJob[]>([]);
  const [events, setEvents] = useState<WorkbenchEvent[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Concurrency queue via refs to avoid stale closures
  const activeCountRef = useRef(0);
  const pendingQueueRef = useRef<UrlJob[]>([]);

  // Track which events have already been duplicate-checked
  const checkedTempIdsRef = useRef<Set<string>>(new Set());

  // ── Process queue ─────────────────────────────────────────────────
  const processNext = useCallback(() => {
    while (
      activeCountRef.current < MAX_CONCURRENT &&
      pendingQueueRef.current.length > 0
    ) {
      const job = pendingQueueRef.current.shift()!;
      activeCountRef.current++;

      // Mark as processing
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: "processing" as const } : j
        )
      );

      fetchJob(job);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJob = useCallback(
    async (job: UrlJob) => {
      try {
        const res = await fetch("/api/admin/events/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: job.url }),
        });

        const data = await res.json();

        if (!res.ok) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: "error" as const,
                    error: data.error || "Request failed",
                  }
                : j
            )
          );
        } else {
          const importRes = data as ImportResponse;
          const newEvents: WorkbenchEvent[] = importRes.events.map((evt) => ({
            event: evt,
            sourceUrl: job.url,
            sourceJobId: job.id,
            status: "pending" as const,
            isDuplicate: false,
            isPreviouslyRejected: false,
          }));

          // Client-side cross-batch dedup: check normalized URLs
          setEvents((prev) => {
            const existingNormalized = new Set(
              prev
                .map((e) => normalizeUrl((e.edits || e.event).website))
                .filter(Boolean)
            );
            const dedupedNew = newEvents.map((ne) => {
              const normalized = normalizeUrl(ne.event.website);
              if (normalized && existingNormalized.has(normalized)) {
                return { ...ne, isDuplicate: true, duplicateKind: "exact" as const };
              }
              return ne;
            });
            return [...prev, ...dedupedNew];
          });

          // Auto-select non-duplicate new events
          setSelected((prev) => {
            const next = new Set(prev);
            for (const ne of newEvents) {
              next.add(ne.event._tempId);
            }
            return next;
          });

          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: "done" as const,
                    eventCount: importRes.events.length,
                  }
                : j
            )
          );
        }
      } catch {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: "error" as const,
                  error: "Network error",
                }
              : j
          )
        );
      } finally {
        activeCountRef.current--;
        processNext();
      }
    },
    [processNext]
  );

  // ── Submit URLs ───────────────────────────────────────────────────
  const handleSubmitUrls = useCallback(
    (urls: string[]) => {
      const newJobs: UrlJob[] = urls.map((url) => ({
        id: crypto.randomUUID(),
        url,
        status: "queued" as const,
        eventCount: 0,
      }));

      setJobs((prev) => [...prev, ...newJobs]);
      pendingQueueRef.current.push(...newJobs);
      processNext();
    },
    [processNext]
  );

  // ── Retry errored job ─────────────────────────────────────────────
  const handleRetry = useCallback(
    (jobId: string) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: "queued" as const, error: undefined }
            : j
        )
      );
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        const retryJob = { ...job, status: "queued" as const, error: undefined };
        pendingQueueRef.current.push(retryJob);
        processNext();
      }
    },
    [jobs, processNext]
  );

  // ── Duplicate check effect ────────────────────────────────────────
  useEffect(() => {
    const unchecked = events.filter(
      (e) =>
        e.status === "pending" &&
        e.event.website &&
        !checkedTempIdsRef.current.has(e.event._tempId)
    );

    if (unchecked.length === 0) return;

    // Mark as checked immediately to avoid re-runs
    for (const e of unchecked) {
      checkedTempIdsRef.current.add(e.event._tempId);
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/events/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: unchecked.map((e) => ({
              website: (e.edits || e.event).website,
              startDate: (e.edits || e.event).startDate,
            })),
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const dupeMap = new Map<string, DuplicateInfo>();
        const rejectionMap = new Map<string, PreviousRejectionInfo>();

        for (const result of data.results) {
          const evt = unchecked[result.index];
          if (!evt) continue;

          if (result.existingEvent) {
            dupeMap.set(evt.event._tempId, result.existingEvent);
          }
          if (result.rejectedImport) {
            rejectionMap.set(evt.event._tempId, result.rejectedImport);
          }
        }

        if (dupeMap.size > 0 || rejectionMap.size > 0) {
          setEvents((prev) =>
            prev.map((e) => {
              const dupeInfo = dupeMap.get(e.event._tempId);
              const rejInfo = rejectionMap.get(e.event._tempId);
              if (dupeInfo || rejInfo) {
                const eventStart = dateKeyFromInput((e.edits || e.event).startDate);
                const existingStart = dupeInfo
                  ? dateKeyFromInput(dupeInfo.startDate)
                  : null;
                const duplicateKind =
                  dupeInfo && eventStart && existingStart && eventStart !== existingStart
                    ? ("cycle" as const)
                    : dupeInfo
                      ? ("exact" as const)
                      : undefined;
                return {
                  ...e,
                  ...(dupeInfo
                    ? {
                        isDuplicate: true,
                        duplicateInfo: dupeInfo,
                        duplicateKind,
                      }
                    : {}),
                  ...(rejInfo
                    ? {
                        isPreviouslyRejected: true,
                        previousRejection: rejInfo,
                      }
                    : {}),
                };
              }
              return e;
            })
          );

          // Auto-deselect server-confirmed duplicates
          if (dupeMap.size > 0) {
            setSelected((prev) => {
              const next = new Set(prev);
              for (const id of dupeMap.keys()) {
                next.delete(id);
              }
              return next;
            });
          }
        }
      } catch {
        // Non-critical, silently ignore
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [events]);

  // Keep selection aligned with duplicate detection (local + server)
  useEffect(() => {
    const duplicateIds = events
      .filter((e) => e.isDuplicate)
      .map((e) => e.event._tempId);

    if (duplicateIds.length === 0) return;

    setSelected((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of duplicateIds) {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [events]);

  // ── Selection ─────────────────────────────────────────────────────
  const toggleSelect = useCallback((tempId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const pendingIds = events
      .filter(
        (e) =>
          (e.status === "pending" || e.status === "error") &&
          !e.isDuplicate
      )
      .map((e) => e.event._tempId);

    setSelected((prev) => {
      const allSelected = pendingIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of pendingIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...pendingIds]);
    });
  }, [events]);

  // ── Edit ──────────────────────────────────────────────────────────
  const handleEdit = useCallback(
    (tempId: string, updated: ExtractedEvent) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.event._tempId === tempId ? { ...e, edits: updated } : e
        )
      );
    },
    []
  );

  // ── Reject / Restore ─────────────────────────────────────────────
  const handleReject = useCallback(
    (tempId: string) => {
      const wEvent = events.find((e) => e.event._tempId === tempId);
      setEvents((prev) =>
        prev.map((e) =>
          e.event._tempId === tempId
            ? { ...e, status: "rejected" as const }
            : e
        )
      );
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });

      // Persist rejection
      if (wEvent) {
        const evt = wEvent.edits || wEvent.event;
        const url = evt.website;
        if (url) {
          fetch("/api/admin/events/reject-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, eventName: evt.name }),
          }).catch(() => {});
        }
      }
    },
    [events]
  );

  const handleRestore = useCallback(
    (tempId: string) => {
      const wEvent = events.find((e) => e.event._tempId === tempId);
      setEvents((prev) =>
        prev.map((e) =>
          e.event._tempId === tempId
            ? { ...e, status: "pending" as const }
            : e
        )
      );

      // Remove persistent rejection
      if (wEvent) {
        const url = (wEvent.edits || wEvent.event).website;
        if (url) {
          fetch("/api/admin/events/reject-import", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          }).catch(() => {});
        }
      }
    },
    [events]
  );

  // ── Import one ──────────────────────────────────────────────────
  const handleImportOne = useCallback(
    async (tempId: string) => {
      const wEvent = events.find(
        (e) =>
          e.event._tempId === tempId &&
          (e.status === "pending" || e.status === "error")
      );
      if (!wEvent) return;

      const evt = wEvent.edits || wEvent.event;
      if (wEvent.isDuplicate) {
        setEvents((prev) =>
          prev.map((e) =>
            e.event._tempId === tempId
              ? {
                  ...e,
                  status: "error" as const,
                  importError:
                    wEvent.duplicateKind === "cycle"
                      ? "URL already exists. Use \"Next in cycle\" to create a new event."
                      : "This event already exists and cannot be imported again.",
                }
              : e
          )
        );
        return;
      }

      // Mark as importing
      setEvents((prev) =>
        prev.map((e) =>
          e.event._tempId === tempId
            ? { ...e, status: "importing" as const }
            : e
        )
      );

      try {
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

        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          setEvents((prev) =>
            prev.map((e) =>
              e.event._tempId === tempId
                ? {
                    ...e,
                    status: "error" as const,
                    importError: data.error || "Import failed",
                  }
                : e
            )
          );
        } else {
          setEvents((prev) =>
            prev.map((e) =>
              e.event._tempId === tempId
                ? { ...e, status: "imported" as const }
                : e
            )
          );
        }
      } catch {
        setEvents((prev) =>
          prev.map((e) =>
            e.event._tempId === tempId
              ? {
                  ...e,
                  status: "error" as const,
                  importError: "Network error",
                }
              : e
          )
        );
      }

      // Remove from selection
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    },
    [events]
  );

  // ── Import selected ───────────────────────────────────────────────
  const handleImportSelected = useCallback(async () => {
    const toImport = events.filter(
      (e) =>
        selected.has(e.event._tempId) &&
        (e.status === "pending" || e.status === "error") &&
        !e.isDuplicate
    );

    if (toImport.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    for (let i = 0; i < toImport.length; i++) {
      const wEvent = toImport[i];
      const evt = wEvent.edits || wEvent.event;
      const tempId = wEvent.event._tempId;

      // Mark as importing
      setEvents((prev) =>
        prev.map((e) =>
          e.event._tempId === tempId
            ? { ...e, status: "importing" as const }
            : e
        )
      );

      try {
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

        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          setEvents((prev) =>
            prev.map((e) =>
              e.event._tempId === tempId
                ? {
                    ...e,
                    status: "error" as const,
                    importError: data.error || "Import failed",
                  }
                : e
            )
          );
        } else {
          setEvents((prev) =>
            prev.map((e) =>
              e.event._tempId === tempId
                ? { ...e, status: "imported" as const }
                : e
            )
          );
        }
      } catch {
        setEvents((prev) =>
          prev.map((e) =>
            e.event._tempId === tempId
              ? {
                  ...e,
                  status: "error" as const,
                  importError: "Network error",
                }
              : e
          )
        );
      }

      setImportProgress(i + 1);
    }

    // Remove imported from selection
    setSelected((prev) => {
      const next = new Set(prev);
      for (const wEvent of toImport) {
        next.delete(wEvent.event._tempId);
      }
      return next;
    });

    setImporting(false);
  }, [events, selected]);

  const existingUrls = jobs.map((j) => j.url);
  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const processingCount = jobs.filter((j) => j.status === "processing").length;
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const pendingReviewCount = events.filter(
    (e) => e.status === "pending" || e.status === "error"
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-5">
        <h1 className="text-3xl font-bold tracking-tight">Import Command Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Queue multiple sources, review bigger event cards, then import event-by-event.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div className="rounded-lg border border-border bg-background/80 px-3 py-2">
            <span className="text-muted-foreground">Queued</span>
            <div className="text-lg font-semibold">{queuedCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/80 px-3 py-2">
            <span className="text-muted-foreground">Processing</span>
            <div className="text-lg font-semibold">{processingCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/80 px-3 py-2">
            <span className="text-muted-foreground">Completed URLs</span>
            <div className="text-lg font-semibold">{doneCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/80 px-3 py-2">
            <span className="text-muted-foreground">Pending Review</span>
            <div className="text-lg font-semibold">{pendingReviewCount}</div>
          </div>
        </div>
      </div>

      <ImportUrlInput
        onSubmitUrls={handleSubmitUrls}
        existingUrls={existingUrls}
      />

      <ImportJobList jobs={jobs} onRetry={handleRetry} />

      <ImportEventTable
        events={events}
        selected={selected}
        importing={importing}
        importProgress={importProgress}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onEdit={handleEdit}
        onReject={handleReject}
        onRestore={handleRestore}
        onImportSelected={handleImportSelected}
        onImportOne={handleImportOne}
      />
    </div>
  );
}
