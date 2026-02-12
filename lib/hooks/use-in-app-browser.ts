import { useState, useEffect } from "react";
import { isInAppBrowser } from "@/lib/utils/in-app-browser";

export function useInAppBrowser(): boolean {
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  return inApp;
}
