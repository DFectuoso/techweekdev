"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventSuggestion } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SuggestionTable() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/suggestions?status=pending")
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/suggestions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      if (action === "approve") {
        const { eventId } = await res.json();
        router.push(`/admin/events/${eventId}/edit`);
      } else {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      }
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading suggestions...</p>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pending suggestions.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium text-muted-foreground">Name</th>
            <th className="pb-2 font-medium text-muted-foreground">Date</th>
            <th className="pb-2 font-medium text-muted-foreground">Type</th>
            <th className="pb-2 font-medium text-muted-foreground">Region</th>
            <th className="pb-2 font-medium text-muted-foreground">Submitted</th>
            <th className="pb-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((suggestion) => {
            const start = new Date(suggestion.startDate);
            const submitted = new Date(suggestion.createdAt);
            return (
              <tr key={suggestion.id} className="border-b border-border">
                <td className="py-3 pr-4 font-medium max-w-[200px] truncate">
                  {suggestion.name}
                </td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                  {start.toLocaleDateString()}
                </td>
                <td className="py-3 pr-4">
                  {suggestion.eventType && (
                    <Badge variant="secondary">{suggestion.eventType}</Badge>
                  )}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {suggestion.region || "\u2014"}
                </td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                  {submitted.toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(suggestion.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleAction(suggestion.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
