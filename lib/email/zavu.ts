import Zavudev from "@zavudev/sdk";

let _client: Zavudev | null = null;

export function getZavuClient(): Zavudev {
  if (!_client) {
    const apiKey = process.env.ZAVUDEV_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ZAVUDEV_API_KEY");
    }

    _client = new Zavudev({ apiKey });
  }

  return _client;
}

export function getZavuSenderId(): string | undefined {
  return process.env.ZAVU_EMAIL_SENDER_ID || undefined;
}
