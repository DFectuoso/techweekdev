export default function WeekLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-8 w-64 animate-pulse rounded bg-muted mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 animate-pulse rounded bg-muted mb-2" />
            <div className="ml-4 h-20 animate-pulse rounded-lg border border-border bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
