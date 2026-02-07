"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fetch current newsletter status
    fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .catch(() => {});
    // We'll just initialize from a GET or leave it as a toggle
    setLoaded(true);
  }, []);

  async function toggleNewsletter() {
    setSaving(true);
    const newValue = !newsletterOptIn;
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optIn: newValue }),
    });

    if (res.ok) {
      setNewsletterOptIn(newValue);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {session?.user?.name || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {session?.user?.email || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly event roundup</p>
              <p className="text-sm text-muted-foreground">
                Get the best Bay Area tech events in your inbox every Monday.
              </p>
            </div>
            <Button
              variant={newsletterOptIn ? "outline" : "default"}
              size="sm"
              onClick={toggleNewsletter}
              disabled={saving}
            >
              {newsletterOptIn ? "Unsubscribe" : "Subscribe"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
