import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe auth config — no Node.js dependencies (no bcryptjs, no DB).
 * Used by middleware.ts for route protection.
 */
export default {
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Protected routes
      const isProtected =
        path.startsWith("/calendar") ||
        path.startsWith("/settings") ||
        path.startsWith("/admin");

      // Auth / landing pages — redirect logged-in users to calendar
      const isAuthPage = path === "/" || path === "/login" || path === "/signup";

      if (isProtected && !isLoggedIn) {
        return false; // redirects to signIn page
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/calendar", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
