import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

import { authConfig } from "./auth.config";
import { credentialsProvider } from "./credentials";
import { normalizeRole, Role } from "./roles";


const SESSION_MAX_AGE = 12 * 60 * 60; // 12 jam

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({

  adapter: PrismaAdapter(prisma),

  ...authConfig,

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },

  providers: [
    credentialsProvider,
  ],

  callbacks: {

    ...authConfig.callbacks,

    async jwt({ token, user }) {

      if (user) {

        token.id_user = user.id_user;

        token.kode_user = user.kode_user;

        token.nama = user.nama;

        token.username = user.username;

        token.role = normalizeRole(user.role) ?? user.role;

        token.foto = user.foto;

        token.theme_preference = user.theme_preference ?? "SYSTEM";
      }

      return token;
    },

    async session({ session, token }) {

      if (session.user) {

        session.user.id_user = token.id_user as number;

        session.user.kode_user = token.kode_user as string;

        session.user.nama = token.nama as string;

        session.user.username = token.username as string;

        const jwtRole = typeof token.role === "string" ? token.role : String(token.role ?? "");
        session.user.role = normalizeRole(jwtRole) ?? (jwtRole as Role);

        session.user.foto = token.foto as string | null;

        session.user.theme_preference = token.theme_preference as string ?? "SYSTEM";

      }

      return session;
    },
  },
});