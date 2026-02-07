"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NewsletterBanner() {
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  if (hidden) return null;

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: true }),
      });
      if (res.ok) {
        setHidden(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mb-6 rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4">
      <button
        onClick={() => setHidden(true)}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
        <div className="flex-1">
          <p className="font-semibold">Get the weekly roundup</p>
          <p className="text-sm text-muted-foreground">
            Bay Area tech events delivered every Monday
          </p>
        </div>
        <Button size="sm" onClick={subscribe} disabled={loading}>
          {loading ? "Subscribing\u2026" : "Subscribe"}
        </Button>
      </div>
    </div>
  );
}
