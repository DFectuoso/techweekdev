interface EventDensityIndicatorProps {
  count: number;
}

export function EventDensityIndicator({ count }: EventDensityIndicatorProps) {
  if (count === 0) return null;

  if (count >= 11) {
    return (
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-600 text-[7px] font-bold text-white leading-none">
        {count}
      </span>
    );
  }

  const dotColor =
    count <= 2
      ? "bg-gray-400"
      : count <= 5
        ? "bg-blue-500"
        : "bg-purple-500";

  const dots = count <= 2 ? 1 : count <= 5 ? 2 : 3;

  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          className={`block h-1 w-1 rounded-full ${dotColor}`}
        />
      ))}
    </div>
  );
}
