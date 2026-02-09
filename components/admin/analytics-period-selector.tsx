"use client";

const PERIODS = [
  { value: "7d", label: "7D" },
  { value: "2w", label: "2W" },
  { value: "4w", label: "4W" },
  { value: "3m", label: "3M" },
] as const;

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

export function AnalyticsPeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === p.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
