"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/db/schema";
import { typeColors } from "@/lib/utils/event-colors";

export function CategoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTypes = (searchParams.get("types") || "")
    .split(",")
    .filter((t): t is EventType => EVENT_TYPES.includes(t as EventType));

  const toggle = useCallback(
    (type: EventType) => {
      const params = new URLSearchParams(searchParams.toString());
      let next: EventType[];
      if (activeTypes.includes(type)) {
        next = activeTypes.filter((t) => t !== type);
      } else {
        next = [...activeTypes, type];
      }
      if (next.length === 0) {
        params.delete("types");
      } else {
        params.set("types", next.join(","));
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [activeTypes, pathname, router, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("types");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isFiltering = activeTypes.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
          isFiltering
            ? "border-primary/35 bg-primary/10 text-foreground"
            : "border-border/70 bg-card/75 text-muted-foreground hover:bg-accent"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M2 4h12M4 8h8M6 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filter
        {isFiltering && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {activeTypes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {isFiltering && (
              <button
                onClick={clearAll}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Clear all
              </button>
            )}
            {EVENT_TYPES.map((type) => {
              const active = activeTypes.includes(type);
              const colors = typeColors[type] || typeColors.other;
              return (
                <button
                  key={type}
                  onClick={() => toggle(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? colors
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
