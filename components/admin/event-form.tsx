"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<{
    name: string;
  } | null>(null);

  const isEdit = !!event;
  const cycleMode = !isEdit && searchParams.get("cycle") === "1";
  const prefill = !isEdit
    ? {
        name: searchParams.get("name") || "",
        description: searchParams.get("description") || "",
        website: cycleMode ? "" : searchParams.get("website") || "",
        price: searchParams.get("price") || "",
        startDate: searchParams.get("startDate") || "",
        endDate: searchParams.get("endDate") || "",
        eventType: searchParams.get("eventType") || "",
        region: searchParams.get("region") || "",
        isFeatured: searchParams.get("isFeatured") === "1",
      }
    : null;

  const prefStartDate = prefill?.startDate
    ? toDatetimeLocal(new Date(prefill.startDate))
    : "";
  const prefEndDate = prefill?.endDate
    ? toDatetimeLocal(new Date(prefill.endDate))
    : "";

  async function submitForm(force: boolean) {
    const form = formRef.current;
    if (!form) return;

    setError("");
    setDuplicateWarning(null);
    setSaving(true);

    const fd = new FormData(form);
    const body: Record<string, unknown> = {
      name: fd.get("name"),
      description: fd.get("description"),
      website: fd.get("website"),
      price: fd.get("price"),
      startDate: fd.get("startDate")
        ? new Date(fd.get("startDate") as string).toISOString()
        : null,
      endDate: fd.get("endDate")
        ? new Date(fd.get("endDate") as string).toISOString()
        : null,
      isFeatured: fd.get("isFeatured") === "on",
      eventType: fd.get("eventType") || null,
      region: fd.get("region") || null,
    };

    if (force) body.force = true;

    const url = isEdit ? `/api/admin/events/${event.id}` : "/api/admin/events";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 409 && data.existingEvent) {
        setDuplicateWarning({ name: data.existingEvent.name });
        setSaving(false);
        return;
      }
      setError(data.error || "Something went wrong");
      setSaving(false);
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitForm(false);
  }

  const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));
  const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {duplicateWarning && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-700 dark:bg-yellow-950">
          <p className="text-yellow-800 dark:text-yellow-200">
            An event with this URL already exists: <strong>{duplicateWarning.name}</strong>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={saving}
            onClick={() => submitForm(true)}
          >
            {isEdit ? "Update Anyway" : "Create Anyway"}
          </Button>
        </div>
      )}

      {cycleMode && (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm dark:border-blue-700 dark:bg-blue-950">
          <p className="text-blue-800 dark:text-blue-200">
            Creating the next event in this cycle. Update the URL if needed before saving.
          </p>
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="Event Name"
        defaultValue={event?.name || prefill?.name || ""}
        required
      />

      <Textarea
        id="description"
        name="description"
        label="Description"
        defaultValue={event?.description || prefill?.description || ""}
        rows={3}
      />

      <Input
        id="website"
        name="website"
        label="Website URL"
        type="url"
        defaultValue={event?.website || prefill?.website || ""}
        placeholder="https://..."
      />

      <Input
        id="price"
        name="price"
        label="Price"
        defaultValue={event?.price || prefill?.price || ""}
        placeholder='Free, $50, $500-$1500'
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="startDate"
          name="startDate"
          label="Start Date"
          type="datetime-local"
          defaultValue={
            event?.startDate
              ? toDatetimeLocal(new Date(event.startDate))
              : prefStartDate
          }
          required
        />
        <Input
          id="endDate"
          name="endDate"
          label="End Date (optional)"
          type="datetime-local"
          defaultValue={
            event?.endDate
              ? toDatetimeLocal(new Date(event.endDate))
              : prefEndDate
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
          defaultValue={event?.eventType || prefill?.eventType || ""}
        />
        <Select
          id="region"
          name="region"
          label="Region"
          options={regionOptions}
          placeholder="Select region"
          defaultValue={event?.region || prefill?.region || ""}
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={event?.isFeatured || prefill?.isFeatured || false}
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
