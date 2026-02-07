import { NextRequest, NextResponse } from "next/server";
import { getWeekStart, getWeekEnd, formatDateRange } from "@/lib/utils/date";
import { getEventsBetween, getFeaturedEvents } from "@/lib/queries/events";
import { getNewsletterSubscribers } from "@/lib/queries/users";
import { generateNewsletterIntro } from "@/lib/ai/generate-newsletter-intro";
import { getResendClient } from "@/lib/email/resend";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { WeeklyNewsletter } from "@/lib/email/weekly-newsletter";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const weekLabel = formatDateRange(weekStart, weekEnd);

  // Featured events: next 3 months
  const featuredEnd = new Date(now);
  featuredEnd.setMonth(featuredEnd.getMonth() + 3);

  // Parallel data fetch
  const [weekEvents, featuredEvents, subscribers] = await Promise.all([
    getEventsBetween(weekStart, weekEnd),
    getFeaturedEvents(now, featuredEnd),
    getNewsletterSubscribers(),
  ]);

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, reason: "no subscribers" });
  }

  // Generate AI intro (graceful degradation)
  const aiIntro = await generateNewsletterIntro(
    weekEvents,
    featuredEvents,
    weekLabel
  );

  // Send emails via Resend batch API in chunks of 100
  const resend = getResendClient();
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || "TechWeek <newsletter@techweek.dev>";
  const appUrl = process.env.APP_URL || "https://techweek.dev";
  const BATCH_SIZE = 100;

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const emails = batch.map((subscriber) => {
      const unsubscribeUrl = buildUnsubscribeUrl(subscriber.id, appUrl);
      return {
        from: fromEmail,
        to: subscriber.email,
        subject: `TechWeek: ${weekLabel}`,
        react: WeeklyNewsletter({
          aiIntro,
          weekEvents,
          featuredEvents,
          unsubscribeUrl,
          weekLabel,
        }),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    try {
      const result = await resend.batch.send(emails);
      if (result.error) {
        console.error("Batch send error:", result.error);
        failed += batch.length;
      } else {
        sent += batch.length;
      }
    } catch (err) {
      console.error("Batch send exception:", err);
      failed += batch.length;
    }
  }

  return NextResponse.json({ sent, failed, subscribers: subscribers.length });
}
