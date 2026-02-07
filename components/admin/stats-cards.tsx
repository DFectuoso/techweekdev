"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalEvents: number;
  futureEvents: number;
  totalUsers: number;
  newsletterSubs: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="animate-pulse">
              <div className="h-8 w-16 rounded bg-muted mb-1" />
              <div className="h-4 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { value: stats.totalEvents, label: "Total Events" },
    { value: stats.futureEvents, label: "Upcoming Events" },
    { value: stats.totalUsers, label: "Users" },
    { value: stats.newsletterSubs, label: "Newsletter Subs" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
