export default function MonthLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-8 w-48 animate-pulse rounded bg-muted mb-4" />
      <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/50" />
    </div>
  );
}
