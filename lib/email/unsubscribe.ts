import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  return process.env.CRON_SECRET!;
}

function sign(userId: string): string {
  return createHmac("sha256", getSecret()).update(userId).digest("base64url");
}

export function buildUnsubscribeUrl(userId: string, baseUrl: string): string {
  const payload = Buffer.from(userId).toString("base64url");
  const hmac = sign(userId);
  return `${baseUrl}/api/newsletter/unsubscribe?token=${payload}.${hmac}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const providedHmac = token.slice(dotIndex + 1);

  let userId: string;
  try {
    userId = Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }

  const expectedHmac = sign(userId);

  // Timing-safe comparison
  const a = Buffer.from(providedHmac);
  const b = Buffer.from(expectedHmac);
  if (a.length !== b.length) return null;

  try {
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return userId;
}
