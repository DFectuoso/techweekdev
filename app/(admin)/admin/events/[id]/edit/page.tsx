"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import type { Event } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { resyncEventFromUrl } from "@/lib/admin/resync-event";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [resyncError, setResyncError] = useState("");
  const [resyncing, setResyncing] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => {
        setLoadError("Event not found");
        setLoading(false);
      });
  }, [id]);

  async function handleResync() {
    if (!event?.website) {
      setResyncError("Add a website URL before resyncing");
      return;
    }

    setResyncError("");
    setResyncing(true);
    try {
      const updated = await resyncEventFromUrl(event);
      setEvent(updated);
      setFormKey((value) => value + 1);
    } catch (error) {
      setResyncError(error instanceof Error ? error.message : "Resync failed");
    } finally {
      setResyncing(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading event...</p>;
  }

  if (loadError || !event) {
    return <p className="text-destructive">{loadError || "Event not found"}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <Button
          type="button"
          variant="outline"
          disabled={!event.website || resyncing}
          onClick={handleResync}
        >
          {resyncing ? "Resyncing..." : "Resync from URL"}
        </Button>
      </div>
      {resyncError && <p className="mb-4 text-sm text-destructive">{resyncError}</p>}
      <EventForm key={formKey} event={event} />
    </div>
  );
}
