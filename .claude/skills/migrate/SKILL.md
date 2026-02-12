---
name: migrate
description: Run Drizzle ORM database migrations for this project. Use when schema changes are made to lib/db/schema.ts and need to be applied to the Turso database.
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [description of schema change]
---

# Drizzle Migration Workflow

This project uses **Drizzle ORM** with a remote **Turso** (libSQL) database. Env vars are in `.env` (not `.env.local`).

## How migrations work in this project

- Schema lives at `lib/db/schema.ts`
- Migrations output to `lib/db/migrations/`
- Config is at `drizzle.config.ts` (reads from `.env.local` but actual env file is `.env`)
- The Turso DB is remote — `drizzle-kit migrate` has historically failed because earlier migrations try to recreate existing tables
- **Use `drizzle-kit push`** to apply schema changes directly — this is the reliable method for this project

## Step-by-step process

### 1. Make schema changes

Edit `lib/db/schema.ts` with new columns, tables, or indexes.

### 2. Generate the migration SQL (for version tracking)

```bash
npx drizzle-kit generate
```

This creates a new `.sql` file in `lib/db/migrations/` and updates the journal. The migration file is useful for documentation and code review, even though we apply via push.

### 3. Apply the changes to the database

```bash
npx drizzle-kit push
```

This compares the current schema against the live Turso DB and applies the diff directly. It will show "Changes applied" on success.

**Do NOT use `npx drizzle-kit migrate`** — it tries to replay all migrations from the start and fails because tables already exist in the remote DB.

### 4. Backfill data (if needed)

If the new column needs to be populated for existing rows, create a one-off script in `scripts/` that:

- Loads env from `.env` (not `.env.local`): `import { config } from "dotenv"; config({ path: ".env" });`
- Creates its own drizzle client (don't import from `lib/db` since that's for Next.js runtime)
- Iterates over rows and updates them
- Run with: `npx tsx scripts/<script-name>.ts`

### 5. Type-check

```bash
npx tsc --noEmit
```

Verify the new schema types are consistent across all usages.

## Common gotchas

- **Env file**: The project has `.env`, not `.env.local`. The `drizzle.config.ts` references `.env.local` but dotenv falls back gracefully. For standalone scripts, use `config({ path: ".env" })`.
- **SQLite unique indexes with NULLs**: SQLite allows multiple NULL values in unique indexes — this is fine and expected behavior.
- **Turso is remote**: All commands hit the remote DB. There is no local SQLite file.

$ARGUMENTS
