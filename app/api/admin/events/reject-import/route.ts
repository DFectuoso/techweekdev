import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rejectImportUrl, unrejectImportUrl } from "@/lib/queries/rejected-imports";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { url, eventName } = body as { url: string; eventName?: string };

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  await rejectImportUrl(url, eventName ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { url } = body as { url: string };

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  await unrejectImportUrl(url);
  return NextResponse.json({ ok: true });
}
