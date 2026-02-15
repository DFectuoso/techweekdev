import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ExtractedEvent } from "@/types/import";
import {
  formatDatetimeLocalInBayArea,
  toIsoInBayArea,
} from "@/lib/utils/timezone";

export function toDatetimeLocal(dateStr: string): string {
  return formatDatetimeLocalInBayArea(dateStr) || dateStr.slice(0, 16);
}

export function confidenceColor(c: number): string {
  if (c >= 0.8) return "text-green-600";
  if (c >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

interface EditFormProps {
  event: ExtractedEvent;
  typeOptions: { value: string; label: string }[];
  regionOptions: { value: string; label: string }[];
  onSave: (e: ExtractedEvent) => void;
  onCancel: () => void;
}

export function EditForm({
  event,
  typeOptions,
  regionOptions,
  onSave,
  onCancel,
}: EditFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSave({
      ...event,
      name: (form.get("name") as string) || null,
      description: (form.get("description") as string) || null,
      website: (form.get("website") as string) || null,
      price: (form.get("price") as string) || null,
      startDate: form.get("startDate")
        ? toIsoInBayArea(form.get("startDate") as string)
        : null,
      endDate: form.get("endDate")
        ? toIsoInBayArea(form.get("endDate") as string)
        : null,
      eventType: (form.get("eventType") as ExtractedEvent["eventType"]) || null,
      region: (form.get("region") as ExtractedEvent["region"]) || null,
      isFeatured: form.get("isFeatured") === "on",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        id="edit-name"
        name="name"
        label="Name"
        defaultValue={event.name || ""}
        required
      />
      <Textarea
        id="edit-description"
        name="description"
        label="Description"
        defaultValue={event.description || ""}
        rows={2}
      />
      <Input
        id="edit-website"
        name="website"
        label="Website"
        type="url"
        defaultValue={event.website || ""}
      />
      <Input
        id="edit-price"
        name="price"
        label="Price"
        defaultValue={event.price || ""}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="edit-startDate"
          name="startDate"
          label="Start"
          type="datetime-local"
          defaultValue={event.startDate ? toDatetimeLocal(event.startDate) : ""}
          required
        />
        <Input
          id="edit-endDate"
          name="endDate"
          label="End"
          type="datetime-local"
          defaultValue={event.endDate ? toDatetimeLocal(event.endDate) : ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          id="edit-eventType"
          name="eventType"
          label="Type"
          options={typeOptions}
          placeholder="Select"
          defaultValue={event.eventType || ""}
        />
        <Select
          id="edit-region"
          name="region"
          label="Region"
          options={regionOptions}
          placeholder="Select"
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
        Featured
      </label>
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
