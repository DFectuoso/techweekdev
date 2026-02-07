export const dynamic = "force-dynamic";

import { Hero } from "@/components/landing/hero";
import { StatsBanner } from "@/components/landing/stats-banner";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-primary">
          TechWeek
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get access
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <Hero />
        <StatsBanner />

        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            What&apos;s behind the wall?
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Feature
              title="12-Month Calendar"
              description="See every event at a glance. Drill down by month or week."
            />
            <Feature
              title="Featured Events"
              description="We highlight the ones worth rearranging your schedule for."
            />
            <Feature
              title="Filter by Region"
              description="SF, Peninsula, South Bay, East Bay, North Bay — find what's near you."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        TechWeek — Bay Area Tech Events
      </footer>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
