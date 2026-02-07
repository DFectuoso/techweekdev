interface EventDensityIndicatorProps {
  count: number;
}

export function EventDensityIndicator({ count }: EventDensityIndicatorProps) {
  if (count === 0) return null;

  const dots = count <= 2 ? 1 : count <= 5 ? 2 : 3;

  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          className="block h-1 w-1 rounded-full bg-primary"
        />
      ))}
    </div>
  );
}
