import { EventForm } from "@/components/admin/event-form";

export const metadata = { title: "Create Event — TechWeek" };

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>
      <EventForm />
    </div>
  );
}
