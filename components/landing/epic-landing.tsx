"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/schema";
import { WeekGrid } from "@/components/calendar/week-grid";
import { YearGrid } from "@/components/calendar/year-grid";
import { useEffect, useState, type ReactNode } from "react";

type LandingStats = {
  upcomingEvents: number;
  insiders: number;
};

type EpicLandingProps = {
  stats: LandingStats;
  previews: {
    heroYearDates: string[];
    heroYearEventCountByDate: Record<string, number>;
    heroYearFeaturedEvents: Event[];
    showcaseWeekStartParam: string;
    showcaseWeekEvents: Event[];
    showcaseWeekFeaturedEvents: Event[];
  };
};

const CTA_TEXT = "Browse the calendar";

export function EpicLanding({ stats, previews }: EpicLandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#171717] selection:bg-[#d0f0ff] selection:text-[#171717]">
      <a
        href="#main-content"
        className="sr-only z-[1200] rounded-md bg-[#171717] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header
        className={`fixed left-0 right-0 top-0 z-[1000] border-b transition-all duration-300 ${
          navScrolled
            ? "border-[#171717]/10 bg-[#f6f4ef]/90 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="font-mono text-base font-semibold tracking-tight">
            TechWeek.dev
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm text-[#4a4a4a] hover:text-[#171717]">
              How it works
            </a>
            <a
              href="#features"
              className="text-sm text-[#4a4a4a] hover:text-[#171717]"
            >
              Features
            </a>
            <a
              href="#community"
              className="text-sm text-[#4a4a4a] hover:text-[#171717]"
            >
              Community
            </a>
            <a href="#faq" className="text-sm text-[#4a4a4a] hover:text-[#171717]">
              FAQ
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/signup"
              data-track="nav-cta"
              className="rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#155e75]"
            >
              {CTA_TEXT}
            </Link>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#171717]/20 md:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-[#171717]" />
              <span className="h-0.5 w-5 bg-[#171717]" />
            </span>
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[990] bg-[#f6f4ef] px-6 pb-8 pt-24 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-5 text-lg font-medium">
            <a href="#how" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#community" onClick={() => setMenuOpen(false)}>
              Community
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>
              FAQ
            </a>
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/signup"
              data-track="nav-cta"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg bg-[#0e7490] px-5 py-3 text-center font-semibold text-white"
            >
              {CTA_TEXT}
            </Link>
          </div>
        </div>
      ) : null}

      <main id="main-content" className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[#67e8f9]/30 blur-3xl" />
          <div className="mx-auto grid min-h-[88vh] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6">
            <div className="reveal">
              <p className="mb-5 inline-flex items-center rounded-full border border-[#171717]/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#155e75]">
                Bay Area tech events, sorted
              </p>
              <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                Never miss another Bay Area tech event
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#4a4a4a]">
                One calendar for AI meetups, hackathons, founder dinners, and
                conferences across SF, Peninsula, East Bay, South Bay, and North
                Bay.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  data-track="hero-cta"
                  className="rounded-xl bg-[#0e7490] px-6 py-3 text-center text-base font-semibold text-white hover:bg-[#155e75]"
                >
                  {CTA_TEXT}
                </Link>
              </div>
              <p className="mt-3 text-sm text-[#5f5f5f]">
                Free forever. No spam. Weekly signal only.
              </p>
            </div>

            <div className="reveal reveal-delay-1 overflow-hidden rounded-3xl border border-[#171717]/10 bg-white p-4 shadow-[0_18px_60px_rgba(23,23,23,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#155e75]">
                  Full calendar view
                </p>
                <span className="text-xs text-[#6b7280]">12-month preview</span>
              </div>
              <div className="relative h-[390px] overflow-hidden rounded-2xl border border-[#171717]/10 bg-[#f8fafc]">
                <PreviewCanvas zoom={0.47} canvasWidth={1180} offsetY={6}>
                  <YearGrid
                    dates={previews.heroYearDates}
                    eventCountByDate={previews.heroYearEventCountByDate}
                    featuredEvents={previews.heroYearFeaturedEvents}
                    previewMode
                  />
                </PreviewCanvas>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f0fdf4] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="reveal text-3xl font-bold tracking-tight md:text-5xl">
              Plan your highest-leverage week before everyone else
            </h2>
            <p className="reveal mt-4 max-w-3xl text-lg text-[#4a4a4a]">
              See the week at a glance, pick the right rooms to be in, and
              build momentum fast. Create your free account to browse real event
              details and links.
            </p>
            <div className="reveal mt-6">
              <Link
                href="/signup"
                data-track="week-preview-cta"
                className="inline-flex rounded-xl bg-[#0e7490] px-6 py-3 text-base font-semibold text-white hover:bg-[#155e75]"
              >
                {CTA_TEXT}
              </Link>
            </div>
            <div className="reveal mt-10 overflow-hidden rounded-3xl border border-[#171717]/10 bg-white shadow-[0_16px_50px_rgba(23,23,23,0.08)]">
              <div className="flex items-center justify-between border-b border-[#171717]/10 px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#155e75]">
                  This Week
                </h3>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[#0e7490] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#155e75]"
                >
                  {CTA_TEXT}
                </Link>
              </div>
              <div className="p-4 md:p-5">
                <WeekGrid
                  weekStartParam={previews.showcaseWeekStartParam}
                  events={previews.showcaseWeekEvents}
                  featuredEvents={previews.showcaseWeekFeaturedEvents}
                  previewMode
                  previewLabel="Featured members-only event"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#171717]/10 bg-white/70 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-4 text-sm md:flex-row md:gap-10 md:px-6">
            <p className="font-semibold text-[#155e75]">
              Trusted by operators, founders, and builders across the Bay
            </p>
            <p className="text-[#4a4a4a]">
              <span className="font-semibold text-[#171717]">
                {stats.upcomingEvents.toLocaleString()}
              </span>{" "}
              upcoming events tracked
            </p>
            <p className="text-[#4a4a4a]">
              <span className="font-semibold text-[#171717]">
                {stats.insiders.toLocaleString()}
              </span>{" "}
              subscribers already inside
            </p>
          </div>
        </section>

        <section className="bg-[#1f2937] py-20 text-white md:py-24">
          <div className="reveal mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
              Great events are everywhere. Discovery is still broken.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <PainPoint text="You hear about key events only after they sold out." />
              <PainPoint text="Event info is scattered across newsletters, Slack, and random posts." />
              <PainPoint text="You waste hours sorting noise instead of showing up." />
            </div>
          </div>
        </section>

        <section id="how" className="bg-[#ecfeff] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="reveal text-3xl font-bold tracking-tight md:text-5xl">
              How it works in three fast steps
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <StepCard
                step="1"
                title="We gather"
                description="We aggregate events across trusted Bay Area sources every day."
              />
              <StepCard
                step="2"
                title="We filter"
                description="Only high-signal tech events make it through to your feed."
              />
              <StepCard
                step="3"
                title="You show up"
                description="Use one weekly snapshot to plan smarter networking and learning."
              />
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-6xl space-y-14 px-4 md:px-6">
            <h2 className="reveal text-3xl font-bold tracking-tight md:text-5xl">
              Built for people who move fast
            </h2>
            <FeatureRow
              title="Find events by region, instantly"
              body="Jump from SF to South Bay, or narrow to neighborhoods in seconds. You see what matters to your actual commute and schedule."
              badge="Geo filters"
              reverse={false}
            />
            <FeatureRow
              title="See this week and the long game"
              body="Switch between immediate plans and year-level scanning. Spot major moments early so you can reserve time before everyone else."
              badge="Week + Year views"
              reverse={true}
            />
            <FeatureRow
              title="Get signal, not endless feed fatigue"
              body="Featured picks highlight events worth reshuffling your week for. The point is momentum, not doomscrolling event listings."
              badge="Curated highlights"
              reverse={false}
            />
          </div>
        </section>

        <section id="community" className="bg-[#fff7ed] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="reveal text-3xl font-bold tracking-tight md:text-5xl">
              What the community says
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <Testimonial
                quote="I stopped discovering meetups after the fact. TechWeek gives me a clear weekly game plan."
                name="Head of Developer Relations"
                company="AI infrastructure startup"
              />
              <Testimonial
                quote="The region filters are the killer feature. I can plan around where my team already is."
                name="Engineering Manager"
                company="B2B SaaS team"
              />
              <Testimonial
                quote="It feels like someone did the heavy lifting for me. I just pick and go."
                name="Founder"
                company="Seed-stage fintech"
              />
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="bg-[#0f172a] py-20 text-white md:py-24"
        >
          <div className="reveal mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Your next big intro is one event away
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[#cbd5e1]">
              Start with this week&apos;s best events and keep your network
              momentum compounding.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                data-track="cta-bottom"
                className="inline-flex rounded-xl bg-[#22d3ee] px-7 py-3 text-lg font-semibold text-[#082f49] hover:bg-[#67e8f9]"
              >
                {CTA_TEXT}
              </Link>
            </div>
            <p className="mt-3 text-sm text-[#94a3b8]">
              No credit card. You can cancel anytime.
            </p>
          </div>
        </section>

        <section id="faq" className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <h2 className="reveal text-3xl font-bold tracking-tight md:text-5xl">
              Questions, answered
            </h2>
            <div className="mt-8 space-y-3">
              <Faq
                question="Is this free?"
                answer="Yes. You can browse and stay informed without paying. We focus on making discovery useful first."
              />
              <Faq
                question="Which events are included?"
                answer="Bay Area tech events across AI, developer tools, startup, security, product, and founder communities."
              />
              <Faq
                question="How often is the calendar updated?"
                answer="New events are reviewed and added continuously, with a weekly digest to keep planning simple."
              />
              <Faq
                question="Can I submit an event?"
                answer="Yes. You can suggest events, and they are reviewed to keep the feed high signal."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#171717]/10 bg-[#f6f4ef] py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4 md:px-6">
          <div className="md:col-span-2">
            <p className="font-mono text-lg font-semibold">TechWeek.dev</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4a4a4a]">
              The insider calendar for Bay Area tech events. Find what matters,
              move faster, and never hear about great events too late.
            </p>
            <Link
              href="/signup"
              data-track="footer-cta"
              className="mt-5 inline-flex rounded-lg border border-[#171717]/20 px-4 py-2 text-sm font-semibold hover:border-[#171717]/40"
            >
              {CTA_TEXT}
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/calendar" className="hover:underline">
                  Calendar
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:underline">
                  Join
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
              Company
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/signup" className="hover:underline">
                  {CTA_TEXT}
                </Link>
              </li>
              <li>
                <a href="https://x.com/dfect" target="_blank" rel="noreferrer" className="hover:underline">
                  Follow me on X
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-[#171717]/10 px-4 pt-6 text-sm text-[#4a4a4a] md:px-6">
          <p>
            Made with love ❤️ by{" "}
            <a
              href="https://x.com/dfect"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#171717] hover:underline"
            >
              Santiago Zavala
            </a>
            . Follow on{" "}
            <a
              href="https://x.com/dfect"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#171717] hover:underline"
            >
              X
            </a>
            .
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition:
            opacity 700ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 {
          transition-delay: 120ms;
        }
        a:focus-visible,
        button:focus-visible,
        summary:focus-visible {
          outline: 2px solid #0e7490;
          outline-offset: 2px;
          border-radius: 8px;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          * {
            animation: none !important;
            transition-duration: 0ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

function PainPoint({ text }: { text: string }) {
  return (
    <div className="reveal rounded-2xl border border-white/15 bg-white/5 p-5">
      <p className="text-base leading-relaxed text-slate-200">{text}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <article className="reveal rounded-2xl border border-[#171717]/10 bg-white p-6 shadow-[0_10px_30px_rgba(23,23,23,0.06)]">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0e7490] text-sm font-semibold text-white">
        {step}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-[#4a4a4a]">{description}</p>
    </article>
  );
}

function FeatureRow({
  title,
  body,
  badge,
  reverse,
}: {
  title: string;
  body: string;
  badge: string;
  reverse: boolean;
}) {
  return (
    <article
      className={`reveal grid items-center gap-6 md:grid-cols-2 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}
    >
      <div>
        <p className="mb-3 inline-flex rounded-full border border-[#171717]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#155e75]">
          {badge}
        </p>
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h3>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#4a4a4a]">{body}</p>
      </div>
      <div className="rounded-3xl border border-[#171717]/10 bg-gradient-to-br from-[#ecfeff] via-[#f0f9ff] to-[#dbeafe] p-6">
        <div className="rounded-2xl border border-[#171717]/10 bg-white/80 p-5">
          <div className="mb-3 h-2 w-16 rounded-full bg-[#22d3ee]/60" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-[#0f172a]/10" />
            <div className="h-3 w-5/6 rounded bg-[#0f172a]/10" />
            <div className="h-3 w-4/6 rounded bg-[#0f172a]/10" />
          </div>
        </div>
      </div>
    </article>
  );
}

function Testimonial({
  quote,
  name,
  company,
}: {
  quote: string;
  name: string;
  company: string;
}) {
  return (
    <article className="reveal rounded-2xl border border-[#171717]/10 bg-white p-6 shadow-[0_10px_30px_rgba(23,23,23,0.05)]">
      <p className="text-lg leading-relaxed text-[#1f2937]">&ldquo;{quote}&rdquo;</p>
      <p className="mt-5 text-sm font-semibold">{name}</p>
      <p className="text-sm text-[#6b7280]">{company}</p>
    </article>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <details data-track="faq-expand" className="rounded-xl border border-[#171717]/10 bg-[#fafafa] p-5">
      <summary className="cursor-pointer list-none text-base font-semibold marker:content-none">
        {question}
      </summary>
      <p className="mt-3 text-[#4a4a4a]">{answer}</p>
    </details>
  );
}

function PreviewCanvas({
  children,
  zoom,
  canvasWidth = 980,
  offsetY = 0,
}: {
  children: ReactNode;
  zoom: number;
  canvasWidth?: number;
  offsetY?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-0 origin-top p-2"
        style={{
          width: `${canvasWidth}px`,
          top: `${offsetY}px`,
          transform: `translateX(-50%) scale(${zoom})`,
        }}
      >
        <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
