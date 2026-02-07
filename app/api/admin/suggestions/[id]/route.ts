import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  approveSuggestion,
  updateSuggestionStatus,
} from "@/lib/queries/suggestions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  try {
    if (action === "approve") {
      const eventId = await approveSuggestion(id, session.user.id!);
      return NextResponse.json({ success: true, eventId });
    } else {
      await updateSuggestionStatus(id, "rejected", session.user.id!);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 400 }
    );
  }
}
