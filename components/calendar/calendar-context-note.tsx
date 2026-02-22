interface CalendarContextNoteProps {
  isLoggedIn: boolean;
}

export function CalendarContextNote({
  isLoggedIn,
}: CalendarContextNoteProps) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 px-4 py-3.5 shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-16 w-16 rounded-full bg-orange-200/40 blur-xl" />

      <div className="relative flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-300/50 bg-white/80 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M2 12h20" />
            <path d="M20 6H4" />
            <path d="M20 18H4" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
            Bay Area + SF Tech Events
          </p>
          <p className="mt-0.5 text-sm text-foreground/75">
            Curated AI, startup, and developer events across San Francisco and
            the wider Bay Area, organized into one calendar.
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full border border-rose-300/60 bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
              SF
            </span>
            <span className="inline-flex items-center rounded-full border border-orange-300/60 bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
              Bay Area
            </span>
            <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Updated Daily
            </span>
            {!isLoggedIn && (
              <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Public View
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
