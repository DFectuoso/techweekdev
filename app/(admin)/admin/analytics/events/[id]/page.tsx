import { AnalyticsEventDetail } from "@/components/admin/analytics-event-detail";

export const metadata = { title: "Event Analytics — TechWeek Admin" };

export default async function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnalyticsEventDetail eventId={id} />;
}
