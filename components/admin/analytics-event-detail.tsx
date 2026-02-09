"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsPeriodSelector } from "./analytics-period-selector";
import { AnalyticsStatCard } from "./analytics-stat-card";
import { AnalyticsBarChart } from "./analytics-bar-chart";

interface EventData {
  event: {
    id: string;
    name: string;
    website: string | null;
    isFeatured: boolean;
  };
  clicksPerDay: { date: string; clicks: number }[];
  summary: {
    totalClicks: number;
    uniqueEvents: number;
    dailyAverage: number;
  };
}

interface Props {
  eventId: string;
}

export function AnalyticsEventDetail({ eventId }: Props) {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback((p: string) => {
    setLoading(true);
    fetch(`/api/admin/analytics/events/${eventId}?period=${p}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [eventId]);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/analytics" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Analytics
        </Link>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-8 w-16 rounded bg-muted mb-1" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Link href="/admin/analytics" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to Analytics
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.event.name}</h1>
          {data.event.website && (
            <a
              href={data.event.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {data.event.website}
            </a>
          )}
        </div>
        <AnalyticsPeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AnalyticsStatCard label="Total Clicks" value={data.summary.totalClicks.toLocaleString()} />
        <AnalyticsStatCard label="Daily Average" value={data.summary.dailyAverage} />
        <AnalyticsStatCard
          label="Featured"
          value={data.event.isFeatured ? "Yes" : "No"}
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <AnalyticsBarChart
            data={data.clicksPerDay.map((d) => ({ date: d.date, value: d.clicks }))}
            label="Clicks"
          />
        </CardContent>
      </Card>
    </div>
  );
}
