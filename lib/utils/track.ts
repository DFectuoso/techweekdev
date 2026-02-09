function send(data: Record<string, string | undefined>) {
  try {
    const body = JSON.stringify(data);
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/track", blob)) return;
    fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    // silent fail
  }
}

export function trackEventClick(eventId: string, source: string) {
  send({ type: "click", eventId, source });
}

export function trackPageView(path: string, userId?: string) {
  send({ type: "pageview", path, userId });
}
