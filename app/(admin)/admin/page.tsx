import { StatsCards } from "@/components/admin/stats-cards";

export const metadata = { title: "Admin Dashboard — TechWeek" };

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <StatsCards />
    </div>
  );
}
