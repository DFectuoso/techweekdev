import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { unsubscribeUser } from "@/lib/queries/users";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(htmlPage("Invalid Link", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return new NextResponse(htmlPage("Invalid Link", "This unsubscribe link is invalid or has been tampered with."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  await unsubscribeUser(userId);

  return new NextResponse(
    htmlPage(
      "Unsubscribed",
      "You have been successfully unsubscribed from the TechWeek weekly newsletter. You can re-subscribe anytime from your account settings."
    ),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — TechWeek</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #fafafa;
      color: #0a0a0a;
    }
    .card {
      text-align: center;
      max-width: 400px;
      padding: 40px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e4e4e7;
    }
    h1 { font-size: 24px; margin: 0 0 12px; }
    p { font-size: 15px; color: #3f3f46; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
