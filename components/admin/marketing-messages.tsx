"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import type { Event } from "@/lib/db/schema";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatDayHeader(date: Date): string {
  const day = DAY_NAMES[date.getDay()];
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `🗓️ ${day}, ${month} ${date.getDate()}`;
}

function groupEventsByDay(events: Event[]): Map<string, Event[]> {
  const grouped = new Map<string, Event[]>();
  for (const event of events) {
    const date = new Date(event.startDate);
    const key = date.toDateString();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(event);
  }
  return grouped;
}

function buildMessagesBlock(events: Event[]): string {
  const grouped = groupEventsByDay(events);
  const sections: string[] = [];

  for (const [dateStr, dayEvents] of grouped) {
    const date = new Date(dateStr);
    const lines: string[] = [formatDayHeader(date), ""];

    for (const event of dayEvents) {
      const name = event.region
        ? `${event.name} (${event.region})`
        : event.name;
      lines.push(name);
      if (event.website) {
        lines.push(event.website);
      }
      lines.push("");
    }

    sections.push(lines.join("\n"));
  }

  return sections.join("\n");
}

interface MarketingMessagesProps {
  events: Event[];
  weekLabel: string;
}

export function MarketingMessages({
  events,
  weekLabel,
}: MarketingMessagesProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesBlock = buildMessagesBlock(events);

  async function handleCopy() {
    await navigator.clipboard.writeText(messagesBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/marketing/generate", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Failed to generate");
      }
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {events.length} event{events.length !== 1 ? "s" : ""} next week (
              {weekLabel})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={events.length === 0}
            >
              {copied ? "Copied!" : "Copy All"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events found for next week.
            </p>
          ) : (
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
              {messagesBlock}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a short social media blurb about next week&apos;s events.
          </p>

          <Button
            onClick={handleGenerate}
            disabled={generating || events.length === 0}
          >
            {generating ? "Generating..." : "Generate AI Summary"}
          </Button>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {summary && (
            <textarea
              className="w-full rounded-md border border-border bg-background p-3 text-sm"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
