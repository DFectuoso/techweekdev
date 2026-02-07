"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleToggleAdmin(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const action = user.isAdmin ? "demote" : "promote";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleAdmin" }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isAdmin: !u.isAdmin } : u))
      );
    }
  }

  async function handleToggleNewsletter(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const action = user.newsletterOptIn ? "unsubscribe" : "subscribe";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleNewsletter" }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, newsletterOptIn: !u.newsletterOptIn } : u
        )
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium text-muted-foreground">Name</th>
            <th className="pb-2 font-medium text-muted-foreground">Email</th>
            <th className="pb-2 font-medium text-muted-foreground">Admin</th>
            <th className="pb-2 font-medium text-muted-foreground">Newsletter</th>
            <th className="pb-2 font-medium text-muted-foreground">Created</th>
            <th className="pb-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border">
              <td className="py-3 pr-4 font-medium max-w-[200px] truncate">
                {user.name || "—"}
              </td>
              <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">
                {user.email || "—"}
              </td>
              <td className="py-3 pr-4">
                <Badge variant={user.isAdmin ? "default" : "outline"}>
                  {user.isAdmin ? "Admin" : "User"}
                </Badge>
              </td>
              <td className="py-3 pr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleNewsletter(user.id)}
                >
                  {user.newsletterOptIn ? "Yes" : "No"}
                </Button>
              </td>
              <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAdmin(user.id)}
                  >
                    {user.isAdmin ? "Demote" : "Promote"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
