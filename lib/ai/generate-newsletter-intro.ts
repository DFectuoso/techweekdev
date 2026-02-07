import Anthropic from "@anthropic-ai/sdk";
import type { Event } from "@/lib/db/schema";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _client;
}

export async function generateNewsletterIntro(
  weekEvents: Event[],
  featuredEvents: Event[],
  weekLabel: string
): Promise<string | null> {
  try {
    const eventSummary = weekEvents
      .map((e) => {
        const parts = [e.name];
        if (e.eventType) parts.push(`(${e.eventType})`);
        if (e.region) parts.push(`in ${e.region}`);
        if (e.startDate) parts.push(`on ${new Date(e.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`);
        return parts.join(" ");
      })
      .join("; ");

    const featuredSummary = featuredEvents
      .map((e) => e.name)
      .join("; ");

    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You write short newsletter intros for a Bay Area tech events calendar called TechWeek. " +
        "Write 2-3 sentences that are professional, concise, and specific. No emoji. No markdown. No headings. " +
        "Mention 2-3 standout events by name and why they're worth checking out. " +
        "Give readers a reason to scroll down. Do not start with a greeting or \"this week\".",
      messages: [
        {
          role: "user",
          content: `Write a brief intro for the ${weekLabel} newsletter.\n\nThis week's events (${weekEvents.length} total): ${eventSummary || "None"}\n\nUpcoming featured events: ${featuredSummary || "None"}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return text.trim() || null;
  } catch (err) {
    console.error("Failed to generate newsletter intro:", err);
    return null;
  }
}
