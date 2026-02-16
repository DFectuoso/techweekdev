interface EventDensityIndicatorProps {
  count: number;
}

export function EventDensityIndicator({ count }: EventDensityIndicatorProps) {
  if (count === 0) return null;

  const bg =
    count <= 2
      ? "bg-gray-200/80"
      : count <= 5
        ? "bg-blue-100"
        : "bg-purple-100";

  const numColor =
    count <= 2
      ? "text-gray-500"
      : count <= 5
        ? "text-blue-600"
        : "text-purple-600";

  const label = count === 1 ? "event" : "events";

  return (
    <div className={`flex flex-col items-center px-1 py-0.5 ${bg}`}>
      <span className={`text-[11px] font-bold leading-none ${numColor}`}>
        {count}
      </span>
      <span className="text-[7px] leading-tight text-muted-foreground/70 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
