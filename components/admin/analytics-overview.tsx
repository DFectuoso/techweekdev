"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsPeriodSelector } from "./analytics-period-selector";
import { AnalyticsStatCard } from "./analytics-stat-card";
import { AnalyticsBarChart } from "./analytics-bar-chart";

interface ClickSummary {
  totalClicks: number;
  uniqueEvents: number;
  dailyAverage: number;
}

interface PageViewSummary {
  totalViews: number;
  uniqueVisitors: number;
  dailyAverage: number;
}

interface TopEvent {
  eventId: string;
  eventName: string;
  website: string | null;
  isFeatured: boolean;
  clicks: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface OverviewData {
  clicksPerDay: { date: string; clicks: number }[];
  clickSummary: ClickSummary;
  topEvents: TopEvent[];
  pageViewsPerDay: { date: string; views: number }[];
  pageViewSummary: PageViewSummary;
  topPages: TopPage[];
}

export function AnalyticsOverview() {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback((p: string) => {
    setLoading(true);
    fetch(`/api/admin/analytics/overview?period=${p}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  const handlePeriodChange = (p: string) => setPeriod(p);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <AnalyticsPeriodSelector value={period} onChange={handlePeriodChange} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="animate-pulse p-4">
                <div className="h-8 w-16 rounded bg-muted mb-1" />
                <div className="h-4 w-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <AnalyticsPeriodSelector value={period} onChange={handlePeriodChange} />
      </div>

      {/* Page Views */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Page Views</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <AnalyticsStatCard label="Total Page Views" value={data.pageViewSummary.totalViews.toLocaleString()} />
          <AnalyticsStatCard label="Unique Visitors (logged-in)" value={data.pageViewSummary.uniqueVisitors.toLocaleString()} />
          <AnalyticsStatCard label="Daily Average" value={data.pageViewSummary.dailyAverage} />
        </div>
        <Card>
          <CardContent className="pt-4">
            <AnalyticsBarChart
              data={data.pageViewsPerDay.map((d) => ({ date: d.date, value: d.views }))}
              label="Views"
            />
          </CardContent>
        </Card>
        {data.topPages.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-2 font-medium text-muted-foreground">Path</th>
                    <th className="px-4 py-2 font-medium text-muted-foreground text-right">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page) => (
                    <tr key={page.path} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2 font-mono text-xs">{page.path}</td>
                      <td className="px-4 py-2 text-right">{page.views.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Event Clicks */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Event Clicks</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <AnalyticsStatCard label="Total Clicks" value={data.clickSummary.totalClicks.toLocaleString()} />
          <AnalyticsStatCard label="Unique Events Clicked" value={data.clickSummary.uniqueEvents.toLocaleString()} />
          <AnalyticsStatCard label="Daily Average" value={data.clickSummary.dailyAverage} />
        </div>
        <Card>
          <CardContent className="pt-4">
            <AnalyticsBarChart
              data={data.clicksPerDay.map((d) => ({ date: d.date, value: d.clicks }))}
              label="Clicks"
            />
          </CardContent>
        </Card>
        {data.topEvents.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-2 font-medium text-muted-foreground">Event</th>
                    <th className="px-4 py-2 font-medium text-muted-foreground text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEvents.map((evt) => (
                    <tr key={evt.eventId} className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/analytics/events/${evt.eventId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {evt.eventName}
                        </Link>
                        {evt.isFeatured && (
                          <span className="ml-2 text-[10px] font-medium uppercase text-amber-600 dark:text-amber-400">Featured</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">{evt.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
