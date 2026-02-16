"use client";

import { Badge } from "@/components/ui/badge";
import type { UrlJob } from "@/types/import";

interface ImportJobListProps {
  jobs: UrlJob[];
  onRetry?: (jobId: string) => void;
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname.replace(/\/$/, "");
    return display.length > 35 ? display.slice(0, 35) + "…" : display;
  } catch {
    return url.slice(0, 35);
  }
}

function StatusIcon({ status }: { status: UrlJob["status"] }) {
  switch (status) {
    case "queued":
      return <span className="text-muted-foreground">⏳</span>;
    case "processing":
      return (
        <span className="inline-block animate-spin text-sm">⟳</span>
      );
    case "done":
      return <span className="text-green-600">✓</span>;
    case "error":
      return <span className="text-red-600">✗</span>;
  }
}

function pillClasses(status: UrlJob["status"]): string {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border";
  switch (status) {
    case "queued":
      return `${base} border-border bg-muted/50 text-muted-foreground`;
    case "processing":
      return `${base} border-blue-300 bg-blue-50 text-blue-800`;
    case "done":
      return `${base} border-green-300 bg-green-50 text-green-800`;
    case "error":
      return `${base} border-red-300 bg-red-50 text-red-800`;
  }
}

export function ImportJobList({ jobs, onRetry }: ImportJobListProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Queue Status
      </div>
      <div className="flex flex-wrap gap-2">
      {jobs.map((job) => (
        <div key={job.id} className={pillClasses(job.status)} title={
          job.status === "error" ? `${job.url}\nError: ${job.error}` : job.url
        }>
          <StatusIcon status={job.status} />
          <span>{truncateUrl(job.url)}</span>
          {job.status === "done" && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {job.eventCount}
            </Badge>
          )}
          {job.status === "error" && onRetry && (
            <button
              onClick={() => onRetry(job.id)}
              className="ml-1 underline hover:no-underline text-[10px]"
            >
              Retry
            </button>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
