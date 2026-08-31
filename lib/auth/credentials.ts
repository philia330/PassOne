import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";

import { prisma } from "@/lib/prisma";

export const credentialsProvider = Credentials({
  name: "Credentials",

  credentials: {
    username: {
      label: "Username atau Email",
      type: "text",
    },
    password: {
      label: "Password",
      type: "password",
    },
  },

  async authorize(credentials) {
    const validated = z
      .object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .safeParse(credentials);

    if (!validated.success) {
      return null;
    }

    const { username, password } = validated.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return null;
    }

    // Tambahan: catat aktivitas login
    // Dibungkus try/catch supaya kalau logging gagal, LOGIN TETAP BERHASIL
    try {
      await logActivity(
        "LOGIN",
        `${user.nama} berhasil login.`,
        user.id_user
      );
    } catch (error) {
      console.error("Gagal mencatat aktivitas login:", error);
      // Sengaja tidak di-throw ulang — login harus tetap lanjut
    }

    return {
      id: String(user.id_user),
      id_user: user.id_user,
      kode_user: user.kode_user,
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
      foto: user.foto,
      theme_preference: user.theme_preference,
    };
  },
});