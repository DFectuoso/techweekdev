"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NewsletterTest() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    sentTo?: string;
    weekEvents?: number;
    featuredEvents?: number;
    error?: string;
  } | null>(null);

  async function handleSend() {
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/newsletter/test", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setResult({ error: data.error || "Failed to send" });
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Send a test version of this week&apos;s newsletter to your email. The
        subject line will be prefixed with [TEST].
      </p>

      <Button onClick={handleSend} disabled={sending}>
        {sending ? "Sending..." : "Send Test Email"}
      </Button>

      {result && (
        <div
          className={`rounded-md p-4 text-sm ${
            result.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {result.success ? (
            <>
              <p className="font-medium">Test email sent!</p>
              <p>Sent to: {result.sentTo}</p>
              <p>
                {result.weekEvents} event{result.weekEvents !== 1 ? "s" : ""}{" "}
                this week, {result.featuredEvents} featured event
                {result.featuredEvents !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
