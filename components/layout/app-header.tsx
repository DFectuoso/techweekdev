"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getWeekStart, formatDateParam } from "@/lib/utils/date";

export function AppHeader() {
  const { data: session } = useSession();
  const thisWeekHref = `/calendar/week/${formatDateParam(getWeekStart(new Date()))}`;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/calendar"
            className="text-lg font-bold tracking-tight text-primary"
          >
            TechWeek
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/calendar"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Full Year
            </Link>
            <Link
              href={thisWeekHref}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              This Week
            </Link>
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:block">
            {session?.user?.name || session?.user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
