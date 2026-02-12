const IN_APP_BROWSER_PATTERNS = [
  /LinkedInApp/i,
  /FBAN/i, // Facebook
  /FBAV/i, // Facebook
  /Instagram/i,
  /BytedanceWebview/i,
  /TikTok/i,
  /Twitter/i,
  /Snapchat/i,
  /Pinterest/i,
  /MicroMessenger/i, // WeChat
  /Line\//i,
  /; wv\)/, // Generic Android WebView
];

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return IN_APP_BROWSER_PATTERNS.some((pattern) => pattern.test(ua));
}

export function openInSystemBrowser(): void {
  const url = window.location.href;
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) {
    // Android intent:// scheme opens the default browser
    const intentUrl =
      `intent://${url.replace(/^https?:\/\//, "")}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;end`;
    window.location.href = intentUrl;
  } else {
    // iOS / other: best-effort fallback
    window.open(url, "_blank");
  }
}
