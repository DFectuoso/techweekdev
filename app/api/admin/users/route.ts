import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers } from "@/lib/queries/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await getAllUsers());
}
