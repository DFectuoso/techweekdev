import Anthropic from "@anthropic-ai/sdk";
import type { Event } from "@/lib/db/schema";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _client;
}

export async function generateMarketingSummary(
  events: Event[],
  weekLabel: string
): Promise<string | null> {
  try {
    const eventSummary = events
      .map((e) => {
        const parts = [e.name];
        if (e.eventType) parts.push(`(${e.eventType})`);
        if (e.region) parts.push(`in ${e.region}`);
        if (e.startDate)
          parts.push(
            `on ${new Date(e.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
          );
        return parts.join(" ");
      })
      .join("; ");

    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You write short social media posts for a Bay Area tech events calendar called TechWeek. " +
        "Write a single short, engaging paragraph suitable for X/Twitter — casual, punchy, exciting. " +
        "Mention 2-3 standout events by name. No hashtags. No emoji. No markdown. " +
        "Keep it under 280 characters if possible, but it's okay to go slightly over.",
      messages: [
        {
          role: "user",
          content: `Write a social media blurb about next week's events (${weekLabel}).\n\nEvents (${events.length} total): ${eventSummary || "None"}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return text.trim() || null;
  } catch (err) {
    console.error("Failed to generate marketing summary:", err);
    return null;
  }
}
