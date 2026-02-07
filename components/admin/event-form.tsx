"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES, REGIONS, type Event } from "@/lib/db/schema";

interface EventFormProps {
  event?: Event;
}

function toDatetimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!event;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      website: form.get("website"),
      price: form.get("price"),
      startDate: form.get("startDate")
        ? new Date(form.get("startDate") as string).toISOString()
        : null,
      endDate: form.get("endDate")
        ? new Date(form.get("endDate") as string).toISOString()
        : null,
      isFeatured: form.get("isFeatured") === "on",
      eventType: form.get("eventType") || null,
      region: form.get("region") || null,
    };

    const url = isEdit ? `/api/admin/events/${event.id}` : "/api/admin/events";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSaving(false);
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));
  const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Input
        id="name"
        name="name"
        label="Event Name"
        defaultValue={event?.name || ""}
        required
      />

      <Textarea
        id="description"
        name="description"
        label="Description"
        defaultValue={event?.description || ""}
        rows={3}
      />

      <Input
        id="website"
        name="website"
        label="Website URL"
        type="url"
        defaultValue={event?.website || ""}
        placeholder="https://..."
      />

      <Input
        id="price"
        name="price"
        label="Price"
        defaultValue={event?.price || ""}
        placeholder='Free, $50, $500-$1500'
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="startDate"
          name="startDate"
          label="Start Date"
          type="datetime-local"
          defaultValue={
            event?.startDate ? toDatetimeLocal(new Date(event.startDate)) : ""
          }
          required
        />
        <Input
          id="endDate"
          name="endDate"
          label="End Date (optional)"
          type="datetime-local"
          defaultValue={
            event?.endDate ? toDatetimeLocal(new Date(event.endDate)) : ""
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="eventType"
          name="eventType"
          label="Event Type"
          options={typeOptions}
          placeholder="Select type"
          defaultValue={event?.eventType || ""}
        />
        <Select
          id="region"
          name="region"
          label="Region"
          options={regionOptions}
          placeholder="Select region"
          defaultValue={event?.region || ""}
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={event?.isFeatured || false}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        Featured event
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : isEdit
              ? "Update Event"
              : "Create Event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
