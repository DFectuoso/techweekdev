import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123!", 12);
  await db
    .insert(schema.users)
    .values({
      name: "Admin",
      email: "admin@techweek.dev",
      hashedPassword,
      isAdmin: true,
      newsletterOptIn: true,
    })
    .onConflictDoNothing();

  console.log("Created admin user: admin@techweek.dev / admin123!");

  // Sample Bay Area tech events
  const now = new Date();
  const year = now.getFullYear();

  const sampleEvents: schema.NewEvent[] = [
    {
      name: "TechCrunch Disrupt SF",
      description:
        "The world's leading startup conference returns to San Francisco with panels, networking, and the legendary Startup Battlefield.",
      website: "https://techcrunch.com/events/disrupt",
      price: "$1,295-$2,495",
      startDate: new Date(year, 2, 12, 9, 0),
      endDate: new Date(year, 2, 14, 18, 0),
      isFeatured: true,
      eventType: "conference",
      region: "SF",
    },
    {
      name: "AI Builders Hackathon",
      description:
        "48-hour hackathon focused on building real AI products. Prizes from top VCs.",
      website: "https://example.com/ai-hackathon",
      price: "Free",
      startDate: new Date(year, 3, 5, 18, 0),
      endDate: new Date(year, 3, 7, 18, 0),
      isFeatured: true,
      eventType: "hackathon",
      region: "SF",
    },
    {
      name: "South Bay Founders Meetup",
      description:
        "Monthly networking event for early-stage founders in the South Bay area.",
      price: "Free",
      startDate: new Date(year, 1, 20, 18, 30),
      eventType: "networking",
      region: "South Bay",
    },
    {
      name: "Climate Tech Demo Day",
      description:
        "10 climate tech startups pitch to a panel of investors and industry leaders.",
      website: "https://example.com/climate-demo",
      price: "Free",
      startDate: new Date(year, 3, 18, 14, 0),
      isFeatured: false,
      eventType: "demoday",
      region: "SF",
    },
    {
      name: "React Summit Bay Area",
      description:
        "Full-day conference on React, Next.js, and modern frontend development.",
      website: "https://example.com/react-summit",
      price: "$399",
      startDate: new Date(year, 4, 10, 9, 0),
      endDate: new Date(year, 4, 10, 18, 0),
      isFeatured: true,
      eventType: "conference",
      region: "SF",
    },
    {
      name: "East Bay Startup Pitch Night",
      description:
        "5-minute pitches from 8 startups followed by Q&A and networking.",
      price: "$15",
      startDate: new Date(year, 4, 22, 18, 0),
      eventType: "pitch",
      region: "East Bay",
    },
    {
      name: "MLOps Workshop",
      description:
        "Hands-on workshop on deploying and monitoring ML models in production.",
      website: "https://example.com/mlops",
      price: "$150",
      startDate: new Date(year, 5, 3, 10, 0),
      endDate: new Date(year, 5, 3, 17, 0),
      eventType: "workshop",
      region: "Peninsula",
    },
    {
      name: "Web3 Builders Night",
      description:
        "Casual meetup for web3 developers. Lightning talks and open discussion.",
      price: "Free",
      startDate: new Date(year, 5, 15, 18, 0),
      eventType: "networking",
      region: "SF",
    },
    {
      name: "SaaS Growth Conference",
      description:
        "Two-day conference on scaling SaaS businesses, featuring top operators and founders.",
      website: "https://example.com/saas-growth",
      price: "$599-$999",
      startDate: new Date(year, 6, 8, 9, 0),
      endDate: new Date(year, 6, 9, 17, 0),
      isFeatured: true,
      eventType: "conference",
      region: "SF",
    },
    {
      name: "Hardware Hack Day",
      description:
        "One-day hardware hackathon with access to 3D printers, CNC machines, and electronics labs.",
      price: "Free",
      startDate: new Date(year, 6, 20, 9, 0),
      endDate: new Date(year, 6, 20, 21, 0),
      eventType: "hackathon",
      region: "South Bay",
    },
    {
      name: "North Bay Founders Dinner",
      description:
        "Intimate dinner for 20 founders in Marin County. Application required.",
      price: "$75",
      startDate: new Date(year, 7, 5, 19, 0),
      eventType: "networking",
      region: "North Bay",
    },
    {
      name: "DevOps Days Silicon Valley",
      description:
        "Community-run conference covering DevOps culture, automation, and platform engineering.",
      website: "https://example.com/devopsdays-sv",
      price: "$200",
      startDate: new Date(year, 8, 12, 9, 0),
      endDate: new Date(year, 8, 13, 17, 0),
      isFeatured: false,
      eventType: "conference",
      region: "South Bay",
    },
    {
      name: "Cybersecurity Summit",
      description:
        "Full-day summit on the latest in cybersecurity threats, tools, and best practices.",
      website: "https://example.com/cybersec",
      price: "$350",
      startDate: new Date(year, 9, 1, 9, 0),
      endDate: new Date(year, 9, 1, 18, 0),
      isFeatured: false,
      eventType: "conference",
      region: "Peninsula",
    },
    {
      name: "AI Art Exhibition & Networking",
      description:
        "Gallery night showcasing AI-generated art with live demos and artist talks.",
      price: "$25",
      startDate: new Date(year, 9, 18, 18, 0),
      eventType: "other",
      region: "SF",
    },
    {
      name: "YC Demo Day (Fall Batch)",
      description:
        "Y Combinator's bi-annual Demo Day featuring the latest batch of startups.",
      website: "https://example.com/yc-demo",
      price: "Invite Only",
      startDate: new Date(year, 10, 5, 10, 0),
      endDate: new Date(year, 10, 6, 16, 0),
      isFeatured: true,
      eventType: "demoday",
      region: "SF",
    },
    {
      name: "Peninsula Product Managers Meetup",
      description:
        "Monthly gathering for PMs on the Peninsula. This month: B2B product growth.",
      price: "Free",
      startDate: new Date(year, 10, 20, 18, 30),
      eventType: "networking",
      region: "Peninsula",
    },
  ];

  for (const event of sampleEvents) {
    await db.insert(schema.events).values(event).onConflictDoNothing();
  }

  console.log(`Seeded ${sampleEvents.length} events.`);
  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
