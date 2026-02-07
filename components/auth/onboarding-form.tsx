"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: true }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = "/calendar";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">One last thing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get Bay Area tech events delivered to your inbox every Monday
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </Button>
        <p className="text-center">
          <a
            href="/calendar"
            className="text-sm text-muted-foreground hover:underline"
          >
            Skip for now
          </a>
        </p>
      </div>
    </div>
  );
}
