import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

import { authConfig } from "./auth.config";
import { credentialsProvider } from "./credentials";
import { Role } from "./roles";


const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 hari
const DEFAULT_MAX_AGE = 12 * 60 * 60; // 12 jam

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
    maxAge: DEFAULT_MAX_AGE, // dipakai sebagai default/fallback
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

        token.role = user.role;

        token.foto = user.foto;

        // Set expiry manual berdasarkan rememberMe
        const rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? false;

        const now = Math.floor(Date.now() / 1000);

        token.exp = now + (rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE);
      }

      return token;
    },

    async session({ session, token }) {

      if (session.user) {

        session.user.id_user = token.id_user as number;

        session.user.kode_user = token.kode_user as string;

        session.user.nama = token.nama as string;

        session.user.username = token.username as string;

        session.user.role = token.role as Role;

        session.user.foto = token.foto as string | null;

      }

      return session;
    },
  },
});