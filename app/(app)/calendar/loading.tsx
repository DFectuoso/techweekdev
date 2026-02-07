export default function CalendarLoading() {
  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-0">
        {Array.from({ length: 90 }).map((_, i) => (
          <div
            key={i}
            className="h-[54px] w-[54px] animate-pulse rounded-md bg-muted/30 m-0"
          />
        ))}
      </div>
    </div>
  );
}
