import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
        Bay Area Tech Events
      </p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Stop missing the events
        <br />
        <span className="text-primary">that actually matter.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Hackathons. Demo days. The conferences worth your time. One calendar,
        zero noise. Built by people tired of hearing about events after they
        happen.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link href="/signup">
          <Button size="lg" className="text-base">
            Get insider access
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg" className="text-base">
            I already have an account
          </Button>
        </Link>
      </div>
    </section>
  );
}
