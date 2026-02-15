"use client";

import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { normalizeUrl } from "@/lib/utils/normalize-url";

interface ImportUrlInputProps {
  onSubmitUrls: (urls: string[]) => void;
  existingUrls: string[];
  disabled?: boolean;
}

export function ImportUrlInput({
  onSubmitUrls,
  existingUrls,
  disabled,
}: ImportUrlInputProps) {
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const lines = value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const validUrls: string[] = [];
    const lineErrors: string[] = [];
    const existingNormalized = new Set(
      existingUrls.map((u) => normalizeUrl(u)).filter(Boolean)
    );

    for (const line of lines) {
      const normalized = normalizeUrl(line);
      if (!normalized) {
        lineErrors.push(`Invalid URL: ${line}`);
        continue;
      }
      if (existingNormalized.has(normalized)) {
        lineErrors.push(`Already queued: ${line}`);
        continue;
      }
      // Check within this batch too
      const alreadyInBatch = validUrls.some(
        (u) => normalizeUrl(u) === normalized
      );
      if (alreadyInBatch) {
        lineErrors.push(`Duplicate in batch: ${line}`);
        continue;
      }
      validUrls.push(line.trim());
    }

    setErrors(lineErrors);

    if (validUrls.length > 0) {
      onSubmitUrls(validUrls);
      // Clear only if all lines were valid, otherwise keep the bad ones
      if (lineErrors.length === 0) {
        setValue("");
      } else {
        // Keep only the lines that had errors
        const errorLines = lines.filter((line) => {
          const normalized = normalizeUrl(line);
          if (!normalized) return true;
          if (existingNormalized.has(normalized)) return true;
          return false;
        });
        setValue(errorLines.join("\n"));
      }
      textareaRef.current?.focus();
    }
  }, [value, existingUrls, onSubmitUrls]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Add Event Source URLs</h2>
          <p className="text-sm text-muted-foreground">
            Paste one URL per line. We&apos;ll process them in parallel.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
            Luma
          </span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
            Eventbrite
          </span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
            Meetup
          </span>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        id="import-urls"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (errors.length > 0) setErrors([]);
        }}
        onKeyDown={handleKeyDown}
        placeholder={
          "https://lu.ma/sf\nhttps://www.eventbrite.com/e/...\nhttps://www.meetup.com/..."
        }
        rows={5}
        disabled={disabled}
        className="text-sm"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Tip: use{" "}
          <span className="font-medium">
            {navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+Enter
          </span>{" "}
          to submit quickly
        </div>
        <Button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="min-w-28"
        >
          Queue URLs
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
