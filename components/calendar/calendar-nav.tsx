import Link from "next/link";

interface CalendarNavProps {
  breadcrumbs: { label: string; href?: string }[];
  prevHref?: string;
  nextHref?: string;
  prevLabel?: string;
  nextLabel?: string;
}

export function CalendarNav({
  breadcrumbs,
  prevHref,
  nextHref,
  prevLabel = "Previous",
  nextLabel = "Next",
}: CalendarNavProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {prevHref && (
          <Link
            href={prevHref}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            &larr; {prevLabel}
          </Link>
        )}
        {nextHref && (
          <Link
            href={nextHref}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            {nextLabel} &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
