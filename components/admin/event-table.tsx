"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { resyncEventFromUrl } from "@/lib/admin/resync-event";

export function EventTable() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();

    let filtered = events;

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.eventType?.toLowerCase().includes(q) ||
          e.region?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }

    // Hide past events unless toggled on
    if (!showPast) {
      filtered = filtered.filter((e) => {
        const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
        return end >= now;
      });
    }

    // Sort ascending by startDate (soonest first)
    return filtered.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [events, search, showPast]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;

    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleResync(event: Event) {
    if (!event.website) return;
    if (!confirm(`Resync "${event.name}" from its website URL?`)) return;

    setActionError("");
    setResyncingId(event.id);
    try {
      const updated = await resyncEventFromUrl(event);
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? updated : e))
      );
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Resync failed"
      );
    } finally {
      setResyncingId(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading events...</p>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No events yet.</p>
        <Link href="/admin/events/new">
          <Button>Create your first event</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
            className="rounded border-border"
          />
          Show past events
        </label>
      </div>
      {actionError && (
        <p className="mb-4 text-sm text-destructive">{actionError}</p>
      )}

      {filteredEvents.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No events found.{" "}
          {!showPast && (
            <button
              onClick={() => setShowPast(true)}
              className="underline hover:text-foreground"
            >
              Show past events?
            </button>
          )}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="pb-2 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="pb-2 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="pb-2 font-medium text-muted-foreground">
                  Region
                </th>
                <th className="pb-2 font-medium text-muted-foreground">
                  Featured
                </th>
                <th className="pb-2 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const start = new Date(event.startDate);
                const isPast = (event.endDate
                  ? new Date(event.endDate)
                  : start) < new Date();
                return (
                  <tr
                    key={event.id}
                    className={`border-b border-border${isPast ? " opacity-50" : ""}`}
                  >
                    <td className="py-3 pr-4 font-medium max-w-[200px] truncate">
                      {event.name}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {start.toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      {event.eventType && (
                        <Badge variant="secondary">{event.eventType}</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {event.region || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {event.isFeatured ? (
                        <span className="text-primary font-medium">Yes</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!event.website || resyncingId === event.id}
                          onClick={() => handleResync(event)}
                        >
                          {resyncingId === event.id
                            ? "Resyncing..."
                            : "Resync"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
