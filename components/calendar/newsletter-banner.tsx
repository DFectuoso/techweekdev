"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NewsletterBannerProps {
  isLoggedIn: boolean;
  newsletterOptIn: boolean;
}

export function NewsletterBanner({
  isLoggedIn,
  newsletterOptIn,
}: NewsletterBannerProps) {
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  if (hidden || (isLoggedIn && newsletterOptIn)) return null;

  async function subscribe() {
    if (!isLoggedIn) return;

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-primary"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>

        <div className="flex-1">
          <p className="font-semibold">
            {isLoggedIn ? "Get the weekly roundup" : "Unlock full event access"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isLoggedIn
              ? "Bay Area tech events delivered every Monday."
              : "Create a free account to open every event link and browse the full calendar experience."}
          </p>
        </div>

        {isLoggedIn ? (
          <Button size="sm" onClick={subscribe} disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/signup"
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
