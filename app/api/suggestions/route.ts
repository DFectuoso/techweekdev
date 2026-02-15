import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSuggestion } from "@/lib/queries/suggestions";
import { parseDateTimeInBayArea } from "@/lib/utils/timezone";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, website, price, startDate, endDate, eventType, region } = body;

  const parsedStartDate =
    typeof startDate === "string" ? parseDateTimeInBayArea(startDate) : null;
  const parsedEndDate =
    typeof endDate === "string" ? parseDateTimeInBayArea(endDate) : null;

  if (!name || !parsedStartDate) {
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
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    eventType: eventType || null,
    region: region || null,
    submittedBy: session.user.id,
  });

  return NextResponse.json(suggestion, { status: 201 });
}
