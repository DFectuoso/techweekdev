"use client";

import { useEffect, useCallback } from "react";
import type { Event } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, generateICS } from "@/lib/utils/date";
import { typeColors } from "@/lib/utils/event-colors";

interface EventDetailDrawerProps {
  event: Event | null;
  onClose: () => void;
}

export function EventDetailDrawer({ event, onClose }: EventDetailDrawerProps) {
  const isOpen = event !== null;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const handleDownloadICS = () => {
    if (!event) return;
    const ics = generateICS({
      name: event.name,
      description: event.description,
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      website: event.website,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.name.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-background border-l border-border shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {event && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border p-6">
              <h2 className="text-2xl font-bold pr-4">{event.name}</h2>
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Date */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Date & Time
                </p>
                <p className="text-sm">
                  {formatDateRange(
                    new Date(event.startDate),
                    event.endDate ? new Date(event.endDate) : null
                  )}
                </p>
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    About
                  </p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Price */}
              {event.price && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Price
                  </p>
                  <p className="text-sm font-medium">{event.price}</p>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {event.eventType && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      typeColors[event.eventType] || typeColors.other
                    }`}
                  >
                    {event.eventType}
                  </span>
                )}
                {event.region && (
                  <Badge variant="outline" className="text-xs">
                    {event.region}
                  </Badge>
                )}
                {event.isFeatured && (
                  <Badge className="bg-primary/10 text-primary text-xs">
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border p-6 space-y-2">
              {event.website && (
                <a
                  href={event.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Visit Website
                </a>
              )}
              <button
                onClick={handleDownloadICS}
                className="flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Download .ics
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
