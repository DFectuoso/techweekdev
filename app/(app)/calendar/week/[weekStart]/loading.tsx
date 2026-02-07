export default function WeekLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-8 w-64 animate-pulse rounded bg-muted mb-4" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-r border-border last:border-r-0 p-2">
            <div className="h-4 w-8 animate-pulse rounded bg-muted mb-1 mx-auto" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted mx-auto mb-2" />
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
              <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
