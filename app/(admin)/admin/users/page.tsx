import { UserTable } from "@/components/admin/user-table";

export const metadata = { title: "Manage Users — TechWeek" };

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <UserTable />
    </div>
  );
}
