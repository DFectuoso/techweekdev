"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import type { Event } from "@/lib/db/schema";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Event not found");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading event...</p>;
  }

  if (error || !event) {
    return <p className="text-destructive">{error || "Event not found"}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EventForm event={event} />
    </div>
  );
}
