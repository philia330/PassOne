"use server";

import { logActivity } from "@/lib/activity-log";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role, JenisKelamin } from "@prisma/client";
import path from "path";
import fs from "fs/promises";
import { requireRole } from "@/lib/auth/guards";

const PAGE_SIZE = 10;

// ======================================================
// Generate Kode User
// USR-001
// USR-002
// ======================================================

const generateKodeUser = async (): Promise<string> => {
  const lastUser = await prisma.user.findFirst({
    orderBy: {
      id_user: "desc",
    },
    select: {
      kode_user: true,
    },
  });

  if (!lastUser) {
    return "USR-001";
  }

  const lastNumber = Number(
    lastUser.kode_user.replace("USR-", "")
  );

  const nextNumber = isNaN(lastNumber)
    ? 1
    : lastNumber + 1;

  return `USR-${String(nextNumber).padStart(3, "0")}`;
};

// ======================================================
// Get Users
// ======================================================

export const getUsers = async (search = "", page = 1) => {
  await requireRole(["ADMIN"]); // sebelumnya requireAuth()
  // ...sisanya tetap sama

  const where = search
    ? {
        OR: [
          { nama: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
          { kode_user: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id_user: true,
        kode_user: true,
        nama: true,
        username: true,
        email: true,
        no_hp: true,
        role: true,
        jkl: true,
        status: true,
        foto: true,
      },
      where,
      orderBy: {
        id_user: "asc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Upload Foto User
// ======================================================

const uploadFoto = async (file: File | null): Promise<string | null> => {
  if (!file || file.size === 0) {
    return null;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Format foto harus JPG, PNG, atau WEBP");
  }

  const maxSize = 2 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Ukuran foto maksimal 2MB");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `user-${Date.now()}.${extension}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "users");

  await fs.mkdir(uploadDir, { recursive: true });

  const uploadPath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await fs.writeFile(uploadPath, buffer);

  return `/uploads/users/${filename}`;
};

// ======================================================
// Create User
// ======================================================

export const createUser = async (formData: FormData) => {
  const session = await requireRole(["ADMIN"]);

  const kode_user = await generateKodeUser();

  const nama = formData.get("nama") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const fotoFile = formData.get("foto") as File;
  const foto = await uploadFoto(fotoFile);

  if (!password) {
    throw new Error("Password wajib diisi");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const email = (formData.get("email") as string) || null;
  const no_hp = (formData.get("no_hp") as string) || null;
  const role = formData.get("role") as Role;
  const jkl = formData.get("jkl") as JenisKelamin;
  const status = formData.get("status") === "true";

  const existingUser = await prisma.user.findFirst({
    where: {
      username,
    },
  });

  if (existingUser) {
    throw new Error("Username sudah digunakan.");
  }

  await prisma.user.create({
    data: {
      kode_user,
      nama,
      username,
      password: hashPassword,
      email,
      no_hp,
      role,
      jkl,
      status,
      foto,
    },
  });

  // Catat aktivitas
  await logActivity(
    "USER_CREATED",
    `User ${nama} (${kode_user}) ditambahkan.`,
    session.user.id_user
  );

  revalidatePath("/masterdata/user");
};

// ======================================================
// Update User
// ======================================================

export const updateUser = async (id: number, formData: FormData) => {
  const session = await requireRole(["ADMIN"]);

  const nama = formData.get("nama") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const email = (formData.get("email") as string) || null;
  const no_hp = (formData.get("no_hp") as string) || null;
  const role = formData.get("role") as Role;
  const jkl = formData.get("jkl") as JenisKelamin;
  const status = formData.get("status") === "true";

  // ======================================================
  // Cek Username Sudah Digunakan User Lain
  // ======================================================

  const existingUsername = await prisma.user.findFirst({
    where: {
      username,
      NOT: {
        id_user: id,
      },
    },
  });

  if (existingUsername) {
    throw new Error("Username sudah digunakan.");
  }

  const fotoFile = formData.get("foto") as File;
  const foto = await uploadFoto(fotoFile);

  // ======================================================
  // Ambil Foto Lama User
  // ======================================================

  const oldUser = await prisma.user.findUnique({
    where: {
      id_user: id,
    },
    select: {
      foto: true,
    },
  });

  const data: Partial<{
    nama: string;
    username: string;
    password: string;
    email: string | null;
    no_hp: string | null;
    role: Role;
    jkl: JenisKelamin;
    status: boolean;
    foto: string | null;
  }> = {
    nama,
    username,
    email,
    no_hp,
    role,
    jkl,
    status,
  };

  if (foto) {
    if (oldUser?.foto) {
      try {
        await fs.unlink(
          path.join(process.cwd(), "public", oldUser.foto.replace(/^\/+/, ""))
        );
      } catch (error) {
        console.error("Gagal menghapus foto lama:", error);
      }
    }

    data.foto = foto;
  }

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: {
      id_user: id,
    },
    data,
  });

  // Catat aktivitas
  await logActivity(
    "USER_UPDATED",
    `User ${nama} diperbarui.`,
    session.user.id_user
  );

  revalidatePath("/masterdata/user");
};

// ======================================================
// Delete User
// ======================================================

export const deleteUser = async (id: number) => {
  const session = await requireRole(["ADMIN"]);

  // ======================================================
  // Ambil Data User
  // ======================================================

  const user = await prisma.user.findUnique({
    where: {
      id_user: id,
    },
    select: {
      foto: true,
      nama: true,
    },
  });

  // ======================================================
  // Hapus File Foto
  // ======================================================

  if (user?.foto) {
    try {
      await fs.unlink(
        path.join(process.cwd(), "public", user.foto.replace(/^\/+/, ""))
      );
    } catch (error) {
      console.error("Gagal menghapus foto:", error);
    }
  }

  // ======================================================
  // Hapus Data User
  // ======================================================

  await prisma.user.delete({
    where: {
      id_user: id,
    },
  });

  // Catat aktivitas
  await logActivity(
    "USER_DELETED",
    `User ${user?.nama ?? `ID ${id}`} dihapus.`,
    session.user.id_user
  );

  revalidatePath("/masterdata/user");
};