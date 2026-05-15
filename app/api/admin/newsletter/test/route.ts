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
  const subject = `[TEST] TechWeek: ${weekLabel}`;
  const email = WeeklyNewsletter({
    aiIntro,
    weekEvents,
    featuredEvents,
    unsubscribeUrl: "{{unsubscribeUrl}}",
    weekLabel,
  });
  const [emailHtmlBody, text] = await Promise.all([
    render(email),
    render(email, { plainText: true }),
  ]);

  try {
    const broadcastResult = await zavu.broadcasts.create({
      name: `[TEST] TechWeek newsletter - ${weekLabel}`,
      channel: "email",
      emailSubject: subject,
      emailHtmlBody,
      text,
      idempotencyKey: `weekly-newsletter-test:${session.user.id}:${Date.now()}`,
      metadata: {
        kind: "newsletter_test",
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel,
      },
      ...(senderId ? { senderId } : {}),
    });

    const broadcastId = broadcastResult.broadcast.id;

    const addResult = await zavu.broadcasts.contacts.add(broadcastId, {
      contacts: [
        {
          recipient: session.user.email,
          templateVariables: {
            name: session.user.name || "",
            unsubscribeUrl: buildUnsubscribeUrl(session.user.id, appUrl),
          },
        },
      ],
    });

    if (addResult.added === 0 && addResult.duplicates === 0) {
      return NextResponse.json(
        {
          error: "Failed to add admin as broadcast contact",
          details: addResult.errors,
        },
        { status: 500 }
      );
    }

    const sendResult = await zavu.broadcasts.send(broadcastId);

    return NextResponse.json({
      success: true,
      sentTo: session.user.email,
      broadcastId,
      status: sendResult.broadcast.status,
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
