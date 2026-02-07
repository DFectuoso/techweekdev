import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSuggestions } from "@/lib/queries/suggestions";
import type { SuggestionStatus } from "@/lib/db/schema";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as SuggestionStatus | null;

  const suggestions = await getSuggestions(status ?? undefined);
  return NextResponse.json(suggestions);
}
