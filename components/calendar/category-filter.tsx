"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/db/schema";
import { typeColors } from "@/lib/utils/event-colors";

export function CategoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const isFiltering = activeTypes.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isFiltering && (
        <button
          onClick={clearAll}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          All
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
  );
}
