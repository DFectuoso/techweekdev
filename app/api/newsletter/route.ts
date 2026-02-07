import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { optIn } = await request.json();

  await db
    .update(users)
    .set({ newsletterOptIn: !!optIn })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true, newsletterOptIn: !!optIn });
}
