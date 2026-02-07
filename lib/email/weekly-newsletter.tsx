import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Heading,
} from "@react-email/components";
import type { Event } from "@/lib/db/schema";
import { formatEventDate, formatDateRange } from "@/lib/utils/date";

interface WeeklyNewsletterProps {
  aiIntro: string | null;
  weekEvents: Event[];
  featuredEvents: Event[];
  unsubscribeUrl: string;
  weekLabel: string;
}

export function WeeklyNewsletter({
  aiIntro,
  weekEvents,
  featuredEvents,
  unsubscribeUrl,
  weekLabel,
}: WeeklyNewsletterProps) {
  const appUrl = process.env.APP_URL || "https://techweek.dev";

  return (
    <Html>
      <Head />
      <Preview>{`${weekLabel}: ${weekEvents.length} tech events in the Bay Area this week`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>
              <Link href={appUrl} style={brandLink}>
                TechWeek
              </Link>
            </Heading>
            <Text style={subtitle}>Bay Area Tech Events</Text>
          </Section>

          <Hr style={hr} />

          {/* Week heading + AI Intro */}
          <Section style={section}>
            <Heading as="h2" style={weekHeading}>
              {weekLabel}
            </Heading>
            {aiIntro && <Text style={introText}>{aiIntro}</Text>}
          </Section>

          {/* This Week */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              This Week
            </Heading>
            {weekEvents.length === 0 ? (
              <Text style={bodyText}>
                No events scheduled this week. Check back next Monday!
              </Text>
            ) : (
              weekEvents.map((event) => (
                <EventCard key={event.id} event={event} appUrl={appUrl} />
              ))
            )}
          </Section>

          {/* Featured Events Coming Up */}
          {featuredEvents.length > 0 && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Heading as="h2" style={h2}>
                  Featured Events Coming Up
                </Heading>
                {featuredEvents.map((event) => (
                  <EventCard key={event.id} event={event} appUrl={appUrl} />
                ))}
              </Section>
            </>
          )}

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Link href={appUrl} style={ctaButton}>
              See all {weekEvents.length + featuredEvents.length} events on the calendar
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={signOffText}>Good vibes, see you next week!</Text>
            <Text style={followText}>
              Follow{" "}
              <Link href="https://x.com/dfect" style={twitterLink}>
                @dfect
              </Link>{" "}
              on Twitter for more on startups, innovation, and Bay Area tech.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>{" "}
              from this newsletter
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function EventCard({ event, appUrl }: { event: Event; appUrl: string }) {
  const dateStr = formatDateRange(event.startDate, event.endDate);
  const meta = [event.eventType, event.region, event.price]
    .filter(Boolean)
    .join(" · ");
  const eventUrl = event.website || appUrl;
  const snippet = event.description
    ? event.description.length > 120
      ? event.description.slice(0, 120) + "..."
      : event.description
    : null;

  return (
    <Section style={eventCard}>
      <Text style={eventName}>
        <Link href={eventUrl} style={eventLink}>
          {event.name}
        </Link>
      </Text>
      <Text style={eventDate}>{dateStr}</Text>
      {meta && <Text style={eventMeta}>{meta}</Text>}
      {snippet && <Text style={eventDescription}>{snippet}</Text>}
    </Section>
  );
}

// ── Inline styles ──────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#fafafa",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
};

const header: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "20px 0 10px",
};

const h1: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const brandLink: React.CSSProperties = {
  color: "#e11d48",
  textDecoration: "none",
};

const subtitle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  margin: "4px 0 0",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "20px 0",
};

const section: React.CSSProperties = {
  padding: "0 0 10px",
};

const h2: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#0a0a0a",
  margin: "0 0 16px",
};

const weekHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 12px",
};

const introText: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3f3f46",
  margin: "0 0 8px",
};

const bodyText: React.CSSProperties = {
  fontSize: "14px",
  color: "#71717a",
};

const eventCard: React.CSSProperties = {
  padding: "12px 16px",
  marginBottom: "12px",
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  border: "1px solid #e4e4e7",
};

const eventName: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const eventLink: React.CSSProperties = {
  color: "#e11d48",
  textDecoration: "none",
};

const eventDate: React.CSSProperties = {
  fontSize: "13px",
  color: "#0a0a0a",
  margin: "0 0 2px",
};

const eventMeta: React.CSSProperties = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0 0 4px",
};

const eventDescription: React.CSSProperties = {
  fontSize: "13px",
  color: "#3f3f46",
  lineHeight: "1.5",
  margin: "4px 0 0",
};

const footer: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "10px 0 20px",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#71717a",
  margin: "4px 0",
};

const footerLink: React.CSSProperties = {
  color: "#71717a",
  textDecoration: "underline",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "10px 0 20px",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#e11d48",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "16px 32px",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const signOffText: React.CSSProperties = {
  fontSize: "14px",
  color: "#3f3f46",
  margin: "0 0 8px",
  fontWeight: "600",
};

const followText: React.CSSProperties = {
  fontSize: "13px",
  color: "#71717a",
  margin: "0 0 16px",
  lineHeight: "1.5",
};

const twitterLink: React.CSSProperties = {
  color: "#e11d48",
  textDecoration: "none",
  fontWeight: "600",
};
