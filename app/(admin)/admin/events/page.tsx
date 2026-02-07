import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventTable } from "@/components/admin/event-table";

export const metadata = { title: "Manage Events — TechWeek" };

export default function AdminEventsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/new">
          <Button>New Event</Button>
        </Link>
      </div>
      <EventTable />
    </div>
  );
}
