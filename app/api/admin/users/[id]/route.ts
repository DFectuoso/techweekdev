import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  toggleUserAdmin,
  toggleUserNewsletter,
  deleteUser,
} from "@/lib/queries/users";

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
  const { action } = body as { action?: string };

  if (action === "toggleNewsletter") {
    try {
      await toggleUserNewsletter(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to update" },
        { status: 400 }
      );
    }
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot modify your own admin status" },
      { status: 400 }
    );
  }

  try {
    await toggleUserAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 400 }
    );
  }
}
