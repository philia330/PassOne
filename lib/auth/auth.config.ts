import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      if (pathname.startsWith("/login")) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.url));
        }

        return true;
      }

      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }

      return true;
    },
  },
};