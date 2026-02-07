import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSuggestion } from "@/lib/queries/suggestions";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, website, price, startDate, endDate, eventType, region } = body;

  if (!name || !startDate) {
    return NextResponse.json(
      { error: "Name and start date are required" },
      { status: 400 }
    );
  }

  const suggestion = await createSuggestion({
    name,
    description: description || null,
    website: website || null,
    price: price || null,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    eventType: eventType || null,
    region: region || null,
    submittedBy: session.user.id,
  });

  return NextResponse.json(suggestion, { status: 201 });
}
