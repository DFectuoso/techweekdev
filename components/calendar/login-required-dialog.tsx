"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";

interface LoginRequiredDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LoginRequiredDialog({
  open,
  onClose,
}: LoginRequiredDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Sign in to unlock full event links">
      <p className="text-sm text-muted-foreground">
        You are viewing the public calendar. Create a free account or log in to
        open every external event page.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          Create free account
        </Link>
        <Link
          href="/login"
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
        >
          Log in
        </Link>
      </div>
    </Dialog>
  );
}
