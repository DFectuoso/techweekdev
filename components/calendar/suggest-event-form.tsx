"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES, REGIONS } from "@/lib/db/schema";

const eventTypeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));
const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));

export function SuggestEventForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description") || null,
      website: form.get("website") || null,
      price: form.get("price") || null,
      startDate: form.get("startDate"),
      endDate: form.get("endDate") || null,
      eventType: form.get("eventType") || null,
      region: form.get("region") || null,
    };

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    }
  }

  if (!isLoggedIn) return null;

  return (
    <div className="flex justify-center mt-8">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Suggest an Event
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Suggest an Event">
        {success ? (
          <p className="text-sm text-green-600">
            Thanks! Your suggestion has been submitted for review.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Event Name"
              placeholder="Event name"
              required
            />
            <Textarea
              id="description"
              name="description"
              label="Description"
              placeholder="Brief description"
            />
            <Input
              id="website"
              name="website"
              label="Website"
              type="url"
              placeholder="https://..."
            />
            <Input
              id="price"
              name="price"
              label="Price"
              placeholder="Free, $20, etc."
            />
            <Input
              id="startDate"
              name="startDate"
              label="Start Date"
              type="datetime-local"
              required
            />
            <Input
              id="endDate"
              name="endDate"
              label="End Date"
              type="datetime-local"
            />
            <Select
              id="eventType"
              name="eventType"
              label="Event Type"
              options={eventTypeOptions}
              placeholder="Select type"
              defaultValue=""
            />
            <Select
              id="region"
              name="region"
              label="Region"
              options={regionOptions}
              placeholder="Select region"
              defaultValue=""
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
