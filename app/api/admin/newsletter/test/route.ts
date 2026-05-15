import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeekStart, getWeekEnd, formatDateRange } from "@/lib/utils/date";
import { getEventsBetween, getFeaturedEvents } from "@/lib/queries/events";
import { generateNewsletterIntro } from "@/lib/ai/generate-newsletter-intro";
import { getZavuClient, getZavuSenderId } from "@/lib/email/zavu";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { WeeklyNewsletter } from "@/lib/email/weekly-newsletter";
import { render } from "@react-email/render";

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

  const zavu = getZavuClient();
  const senderId = getZavuSenderId();
  const appUrl = process.env.APP_URL || "https://techweek.dev";
  const unsubscribeUrl = buildUnsubscribeUrl(session.user.id, appUrl);
  const subject = `[TEST] TechWeek: ${weekLabel}`;
  const email = WeeklyNewsletter({
    aiIntro,
    weekEvents,
    featuredEvents,
    unsubscribeUrl,
    weekLabel,
  });
  const [htmlBody, text] = await Promise.all([
    render(email),
    render(email, { plainText: true }),
  ]);

  try {
    const result = await zavu.messages.send({
      to: session.user.email,
      channel: "email",
      subject,
      htmlBody,
      text,
      metadata: {
        kind: "newsletter_test",
        weekLabel,
      },
      ...(senderId ? { "Zavu-Sender": senderId } : {}),
    });

    return NextResponse.json({
      success: true,
      sentTo: session.user.email,
      messageId: result.message.id,
      status: result.message.status,
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
