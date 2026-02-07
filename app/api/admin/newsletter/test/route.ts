import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeekStart, getWeekEnd, formatDateRange } from "@/lib/utils/date";
import { getEventsBetween, getFeaturedEvents } from "@/lib/queries/events";
import { generateNewsletterIntro } from "@/lib/ai/generate-newsletter-intro";
import { getResendClient } from "@/lib/email/resend";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { WeeklyNewsletter } from "@/lib/email/weekly-newsletter";

export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email || !session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const weekLabel = formatDateRange(weekStart, weekEnd);

  const featuredEnd = new Date(now);
  featuredEnd.setMonth(featuredEnd.getMonth() + 3);

  const [weekEvents, featuredEvents] = await Promise.all([
    getEventsBetween(weekStart, weekEnd),
    getFeaturedEvents(now, featuredEnd),
  ]);

  const aiIntro = await generateNewsletterIntro(
    weekEvents,
    featuredEvents,
    weekLabel
  );

  const resend = getResendClient();
  const fromEmail =
    process.env.NEWSLETTER_FROM_EMAIL || "TechWeek <newsletter@techweek.dev>";
  const appUrl = process.env.APP_URL || "https://techweek.dev";
  const unsubscribeUrl = buildUnsubscribeUrl(session.user.id, appUrl);

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: session.user.email,
      subject: `[TEST] TechWeek: ${weekLabel}`,
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
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentTo: session.user.email,
      weekEvents: weekEvents.length,
      featuredEvents: featuredEvents.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
