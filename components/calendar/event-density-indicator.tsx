interface EventDensityIndicatorProps {
  count: number;
}

export function EventDensityIndicator({ count }: EventDensityIndicatorProps) {
  if (count === 0) return null;

  const bg =
    count <= 2
      ? "bg-gray-200/80 dark:bg-gray-700/80"
      : count <= 5
        ? "bg-blue-100 dark:bg-blue-900/60"
        : "bg-purple-100 dark:bg-purple-900/60";

  const numColor =
    count <= 2
      ? "text-gray-500 dark:text-gray-400"
      : count <= 5
        ? "text-blue-600 dark:text-blue-300"
        : "text-purple-600 dark:text-purple-300";

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
