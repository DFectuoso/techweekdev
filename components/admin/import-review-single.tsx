"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPES, REGIONS } from "@/lib/db/schema";
import type { ExtractedEvent } from "@/types/import";
import {
  formatDatetimeLocalInBayArea,
  toIsoInBayArea,
} from "@/lib/utils/timezone";

interface ImportReviewSingleProps {
  event: ExtractedEvent;
  sourceUrl: string;
  onReset: () => void;
}

function toDatetimeLocal(dateStr: string): string {
  return formatDatetimeLocalInBayArea(dateStr) || dateStr.slice(0, 16);
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return "High";
  if (c >= 0.5) return "Medium";
  return "Low";
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return "text-green-600";
  if (c >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

export function ImportReviewSingle({
  event,
  sourceUrl,
  onReset,
}: ImportReviewSingleProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<{
    name: string;
  } | null>(null);

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
        ? toIsoInBayArea(fd.get("startDate") as string)
        : null,
      endDate: fd.get("endDate")
        ? toIsoInBayArea(fd.get("endDate") as string)
        : null,
      isFeatured: fd.get("isFeatured") === "on",
      eventType: fd.get("eventType") || null,
      region: fd.get("region") || null,
    };

    if (force) body.force = true;

    const res = await fetch("/api/admin/events", {
      method: "POST",
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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Badge variant="secondary">Source: {sourceUrl}</Badge>
        <span className={`text-sm font-medium ${confidenceColor(event._confidence)}`}>
          Confidence: {confidenceLabel(event._confidence)} ({Math.round(event._confidence * 100)}%)
        </span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {duplicateWarning && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm">
            <p className="text-yellow-800">
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
              Import Anyway
            </Button>
          </div>
        )}

        <Input
          id="name"
          name="name"
          label="Event Name"
          defaultValue={event.name || ""}
          required
        />

        <Textarea
          id="description"
          name="description"
          label="Description"
          defaultValue={event.description || ""}
          rows={3}
        />

        <Input
          id="website"
          name="website"
          label="Website URL"
          type="url"
          defaultValue={event.website || ""}
          placeholder="https://..."
        />

        <Input
          id="price"
          name="price"
          label="Price"
          defaultValue={event.price || ""}
          placeholder='Free, $50, $500-$1500'
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startDate"
            name="startDate"
            label="Start Date"
            type="datetime-local"
            defaultValue={event.startDate ? toDatetimeLocal(event.startDate) : ""}
            required
          />
          <Input
            id="endDate"
            name="endDate"
            label="End Date (optional)"
            type="datetime-local"
            defaultValue={event.endDate ? toDatetimeLocal(event.endDate) : ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="eventType"
            name="eventType"
            label="Event Type"
            options={typeOptions}
            placeholder="Select type"
            defaultValue={event.eventType || ""}
          />
          <Select
            id="region"
            name="region"
            label="Region"
            options={regionOptions}
            placeholder="Select region"
            defaultValue={event.region || ""}
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={event.isFeatured}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Featured event
        </label>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Import Event"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Start Over
          </Button>
        </div>
      </form>
    </div>
  );
}
