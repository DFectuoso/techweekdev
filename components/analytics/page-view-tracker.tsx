"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { trackPageView } from "@/lib/utils/track";

export function PageViewTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    trackPageView(pathname, session?.user?.id);
  }, [pathname, status]);

  return null;
}
