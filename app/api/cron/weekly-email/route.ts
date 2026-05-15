import { NextRequest, NextResponse } from "next/server";
import { getWeekStart, getWeekEnd, formatDateRange } from "@/lib/utils/date";
import { getEventsBetween, getFeaturedEvents } from "@/lib/queries/events";
import { getNewsletterSubscribers } from "@/lib/queries/users";
import { generateNewsletterIntro } from "@/lib/ai/generate-newsletter-intro";
import { getZavuClient, getZavuSenderId } from "@/lib/email/zavu";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { WeeklyNewsletter } from "@/lib/email/weekly-newsletter";
import { render } from "@react-email/render";

export const maxDuration = 60;
const CONTACT_BATCH_SIZE = 1000;

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
    return NextResponse.json({
      submitted: false,
      subscribers: 0,
      contacts: { added: 0, duplicates: 0, invalid: 0 },
      reason: "no subscribers",
    });
  }

  // Generate AI intro (graceful degradation)
  const aiIntro = await generateNewsletterIntro(
    weekEvents,
    featuredEvents,
    weekLabel
  );

  const zavu = getZavuClient();
  const senderId = getZavuSenderId();
  const appUrl = process.env.APP_URL || "https://techweek.dev";
  const subject = `TechWeek: ${weekLabel}`;
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

  const broadcastResult = await zavu.broadcasts.create({
    name: `TechWeek newsletter - ${weekLabel}`,
    channel: "email",
    emailSubject: subject,
    emailHtmlBody,
    text,
    idempotencyKey: `weekly-newsletter:${weekStart.toISOString().slice(0, 10)}`,
    metadata: {
      kind: "weekly_newsletter",
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      weekLabel,
    },
    ...(senderId ? { senderId } : {}),
  });

  const broadcastId = broadcastResult.broadcast.id;
  let added = 0;
  let duplicates = 0;
  let invalid = 0;

  for (let i = 0; i < subscribers.length; i += CONTACT_BATCH_SIZE) {
    const batch = subscribers.slice(i, i + CONTACT_BATCH_SIZE);

    try {
      const result = await zavu.broadcasts.contacts.add(broadcastId, {
        contacts: batch.map((subscriber) => ({
          recipient: subscriber.email,
          templateVariables: {
            name: subscriber.name || "",
            unsubscribeUrl: buildUnsubscribeUrl(subscriber.id, appUrl),
          },
        })),
      });

      added += result.added;
      duplicates += result.duplicates;
      invalid += result.invalid;

      if (result.errors?.length) {
        console.error("Broadcast contact add errors:", {
          broadcastId,
          errors: result.errors,
        });
      }
    } catch (err) {
      console.error("Broadcast contact add exception:", {
        broadcastId,
        error: err,
      });
      invalid += batch.length;
    }
  }

  const hasContacts =
    added > 0 || duplicates > 0 || broadcastResult.broadcast.totalContacts > 0;

  if (!hasContacts) {
    return NextResponse.json({
      broadcastId,
      submitted: false,
      subscribers: subscribers.length,
      contacts: { added, duplicates, invalid },
      reason: "no contacts added",
    });
  }

  if (broadcastResult.broadcast.status !== "draft") {
    return NextResponse.json({
      broadcastId,
      submitted: true,
      status: broadcastResult.broadcast.status,
      subscribers: subscribers.length,
      contacts: { added, duplicates, invalid },
      reason: "broadcast already submitted",
    });
  }

  const sendResult = await zavu.broadcasts.send(broadcastId);

  return NextResponse.json({
    broadcastId,
    submitted: true,
    status: sendResult.broadcast.status,
    subscribers: subscribers.length,
    contacts: { added, duplicates, invalid },
  });
}
