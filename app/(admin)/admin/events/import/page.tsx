"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImportReviewSingle } from "@/components/admin/import-review-single";
import { ImportReviewList } from "@/components/admin/import-review-list";
import type { ImportResponse } from "@/types/import";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/events/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setResult(data as ImportResponse);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setUrl("");
    setError("");
  }

  const showList =
    result &&
    result.events.length > 1;

  const showSingle =
    result &&
    result.events.length === 1;

  const showEmpty =
    result &&
    result.events.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Import from URL</h1>

      {!result && (
        <form onSubmit={handleScrape} className="max-w-xl space-y-4">
          <Input
            id="url"
            label="Page URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://lu.ma/sf"
            required
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Scraping..." : "Scrape"}
          </Button>

          {loading && (
            <p className="text-sm text-muted-foreground">
              This may take 10-30 seconds while we scrape the page and extract
              event data...
            </p>
          )}
        </form>
      )}

      {showEmpty && (
        <div className="space-y-4">
          <p className="text-sm text-destructive">
            No events found on this page. Try a different URL.
          </p>
          <Button variant="outline" onClick={handleReset}>
            Try Another URL
          </Button>
        </div>
      )}

      {showSingle && (
        <ImportReviewSingle
          event={result.events[0]}
          sourceUrl={result.sourceUrl}
          onReset={handleReset}
        />
      )}

      {showList && (
        <ImportReviewList
          events={result.events}
          sourceUrl={result.sourceUrl}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
