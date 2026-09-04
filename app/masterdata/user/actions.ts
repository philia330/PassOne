"use server";

import { logActivity } from "@/lib/activity-log";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role, JenisKelamin } from "@prisma/client";
import path from "path";
import fs from "fs/promises";
import { requireRole } from "@/lib/auth/guards";
import { optimizeImageToWebP } from "@/lib/image-utils";
import { normalizeRole } from "@/lib/auth/roles";
import { createUserSchema, updateUserSchema } from "@/lib/validations";

const PAGE_SIZE = 10;

const LEADER_ALLOWED_ROLES: Role[] = [Role.SALES, Role.TEKNISI];

function assertRoleAssignmentAllowed(currentUserRole: string | undefined, targetRole: string) {
  const normalizedCurrentRole = normalizeRole(currentUserRole);
  const normalizedTargetRole = normalizeRole(targetRole);

  if (!normalizedTargetRole) {
    throw new Error("Role tidak valid.");
  }

  if (normalizedCurrentRole === Role.ADMIN) {
    return;
  }

  if (normalizedCurrentRole === Role.LEADER) {
    if (LEADER_ALLOWED_ROLES.includes(normalizedTargetRole)) {
      return;
    }

    throw new Error("Leader hanya dapat menambahkan user dengan role SALES atau TEKNISI.");
  }

  throw new Error("Anda tidak memiliki izin untuk mengatur role user.");
}

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
  const session = await requireRole(["ADMIN", "LEADER"]);
  const currentRole = normalizeRole(session.user.role);

  const leaderAllowedRoles = [Role.SALES, Role.TEKNISI];
  const searchWhere = search
    ? {
        OR: [
          { nama: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
          { kode_user: { contains: search } },
        ],
      }
    : undefined;

  const where =
    currentRole === Role.LEADER
      ? searchWhere
        ? {
            AND: [
              searchWhere,
              { role: { in: leaderAllowedRoles } },
            ],
          }
        : { role: { in: leaderAllowedRoles } }
      : searchWhere ?? {};

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
// Upload Foto User (WebP optimized)
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

  return optimizeImageToWebP(file, "users");
};

// ======================================================
// Create User
// ======================================================

export const createUser = async (formData: FormData) => {
  const session = await requireRole(["ADMIN", "LEADER"]);

  // ======================================================
  // VALIDASI INPUT
  // ======================================================
  // email/no_hp kosong biarkan tetap "" — emailSchema/noHpSchema di
  // lib/validations.ts sudah menormalkan string kosong jadi null lewat
  // z.preprocess, jadi tidak perlu di-armor lagi di sini.
  const rawData = {
    nama: (formData.get("nama") as string)?.trim() || "",
    username: (formData.get("username") as string)?.trim().toLowerCase() || "",
    password: (formData.get("password") as string) || "",
    email: (formData.get("email") as string)?.trim() || "",
    no_hp: (formData.get("no_hp") as string)?.trim() || "",
    role: formData.get("role") as string,
    jkl: formData.get("jkl") as string,
    status: formData.get("status") === "true",
  };

  const parseResult = createUserSchema.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;
  assertRoleAssignmentAllowed(session.user.role, validated.role);

  // ======================================================
  // Generate kode user
  // ======================================================
  const kode_user = await generateKodeUser();

  // ======================================================
  // Upload foto
  // ======================================================
  const fotoFile = formData.get("foto") as File;
  const foto = await uploadFoto(fotoFile);

  // ======================================================
  // Hash password
  // ======================================================
  const hashPassword = await bcrypt.hash(validated.password, 10);

  // ======================================================
  // Cek duplikat username
  // ======================================================
  const existingUser = await prisma.user.findFirst({
    where: {
      username: validated.username,
    },
  });

  if (existingUser) {
    throw new Error("Username sudah digunakan.");
  }

  // ======================================================
  // Create user
  // ======================================================
  await prisma.user.create({
    data: {
      kode_user,
      nama: validated.nama,
      username: validated.username,
      password: hashPassword,
      email: validated.email ?? null,
      no_hp: validated.no_hp ?? null,
      role: validated.role,
      jkl: validated.jkl,
      status: validated.status,
      foto,
    },
  });

  await logActivity(
    "USER_CREATED",
    `User ${validated.nama} (${kode_user}) ditambahkan.`,
    session.user.id_user
  );

  revalidatePath("/masterdata/user");
};

// ======================================================
// Update User
// ======================================================

export const updateUser = async (id: number, formData: FormData) => {
  const session = await requireRole(["ADMIN", "LEADER"]);

  // ======================================================
  // VALIDASI INPUT
  // ======================================================
  const rawData = {
    nama: (formData.get("nama") as string)?.trim() || "",
    username: (formData.get("username") as string)?.trim().toLowerCase() || "",
    password: (formData.get("password") as string) || "",
    email: (formData.get("email") as string)?.trim() || "",
    no_hp: (formData.get("no_hp") as string)?.trim() || "",
    role: formData.get("role") as string,
    jkl: formData.get("jkl") as string,
    status: formData.get("status") === "true",
  };

  const parseResult = updateUserSchema.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;
  assertRoleAssignmentAllowed(session.user.role, validated.role);

  // ======================================================
  // Cek Username Sudah Digunakan User Lain
  // ======================================================

  const existingUsername = await prisma.user.findFirst({
    where: {
      username: validated.username,
      NOT: {
        id_user: id,
      },
    },
  });

  if (existingUsername) {
    throw new Error("Username sudah digunakan.");
  }

  // ======================================================
  // Upload foto
  // ======================================================
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
    nama: validated.nama,
    username: validated.username,
    email: validated.email ?? null,
    no_hp: validated.no_hp ?? null,
    role: validated.role,
    jkl: validated.jkl,
    status: validated.status,
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

  if (validated.password) {
    data.password = await bcrypt.hash(validated.password, 10);
  }

  await prisma.user.update({
    where: {
      id_user: id,
    },
    data,
  });

  await logActivity(
    "USER_UPDATED",
    `User ${validated.nama} diperbarui.`,
    session.user.id_user
  );

  revalidatePath("/masterdata/user");
};

// ======================================================
// Delete User
// ======================================================

export const deleteUser = async (id: number) => {
  const session = await requireRole(["ADMIN"]);

  const user = await prisma.user.findUnique({
    where: {
      id_user: id,
    },
    select: {
      foto: true,
      nama: true,
    },
  });

  if (user?.foto) {
    try {
      await fs.unlink(
        path.join(process.cwd(), "public", user.foto.replace(/^\/+/, ""))
      );
    } catch (error) {
      console.error("Gagal menghapus foto:", error);
    }
  }

  await prisma.user.delete({
    where: {
      id_user: id,
    },
  });

  await logActivity(
    "USER_DELETED",
    `User ${user?.nama ?? `ID ${id}`} dihapus.`,
    session.user.id_user
  );

  revalidatePath("/masterdata/user");
};