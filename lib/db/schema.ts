import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ── Users (extends Auth.js defaults) ────────────────────────────────
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  hashedPassword: text("hashedPassword"),
  newsletterOptIn: integer("newsletterOptIn", { mode: "boolean" })
    .notNull()
    .default(false),
  isAdmin: integer("isAdmin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Auth.js: accounts ───────────────────────────────────────────────
export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

// ── Auth.js: sessions ───────────────────────────────────────────────
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// ── Auth.js: verification tokens ────────────────────────────────────
export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ── Events ──────────────────────────────────────────────────────────
export const EVENT_TYPES = [
  "hackathon",
  "networking",
  "conference",
  "pitch",
  "demoday",
  "workshop",
  "other",
] as const;

export const REGIONS = [
  "SF",
  "Peninsula",
  "South Bay",
  "East Bay",
  "North Bay",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type Region = (typeof REGIONS)[number];

export const events = sqliteTable("event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  price: text("price"),
  startDate: integer("startDate", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("endDate", { mode: "timestamp_ms" }),
  isFeatured: integer("isFeatured", { mode: "boolean" })
    .notNull()
    .default(false),
  eventType: text("eventType").$type<EventType>(),
  region: text("region").$type<Region>(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Type exports ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
