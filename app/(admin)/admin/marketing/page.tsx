import { MarketingMessages } from "@/components/admin/marketing-messages";
import { getWeekStart, getWeekEnd, formatDateRange } from "@/lib/utils/date";
import { getEventsBetween } from "@/lib/queries/events";

export const metadata = { title: "Marketing — TechWeek" };

export default async function AdminMarketingPage() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekStart = getWeekStart(nextWeek);
  const weekEnd = getWeekEnd(nextWeek);
  const weekLabel = formatDateRange(weekStart, weekEnd);

  const events = await getEventsBetween(weekStart, weekEnd);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marketing</h1>
      <MarketingMessages events={events} weekLabel={weekLabel} />
    </div>
  );
}
