export default function CalendarLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg border border-border bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}
