"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/events/new", label: "New Event" },
  { href: "/admin/events/import", label: "Import from URL" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/marketing", label: "Marketing" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </h2>
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-border pt-4">
        <Link
          href="/calendar"
          className="block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Calendar
        </Link>
      </div>
    </aside>
  );
}
