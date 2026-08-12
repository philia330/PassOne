import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toBoolean } from "@/app/api/_lib/import-utils";

async function generateKodeUser() {
  const last = await prisma.user.findFirst({ orderBy: { id_user: "desc" }, select: { kode_user: true } });
  if (!last) return "USR-001";
  const match = last.kode_user.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `USR-${String(next).padStart(3, "0")}`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import User aktif" });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "File Excel tidak ditemukan" }, { status: 400 });
    }

    const rows = await parseExcelFile(file);

    const data = await Promise.all(
      rows.map(async (row, index) => {
        const nama = normalizeString(row.nama ?? row.name);
        const username = normalizeString(row.username ?? row.user_name);
        const password = normalizeString(row.password ?? row.passwd);
        const email = normalizeString(row.email) || null;
        const no_hp = normalizeString(row.no_hp ?? row.phone ?? row.telepon) || null;
        const role = normalizeString(row.role) || "TEKNISI";
        const jkl = normalizeString(row.jkl ?? row.jenis_kelamin) || "Laki-laki";
        const status = toBoolean(row.status ?? row.aktif ?? true);

        if (!nama) throw new Error(`nama kosong pada baris ${index + 2}`);
        if (!username) throw new Error(`username kosong pada baris ${index + 2}`);
        if (!password) throw new Error(`password kosong pada baris ${index + 2}`);

        const hashPassword = await bcrypt.hash(password, 10);
        const kode_user = normalizeString(row.kode_user ?? row.kode) || (await generateKodeUser());

        return {
          kode_user,
          nama,
          username,
          password: hashPassword,
          jkl: jkl.toUpperCase().includes("PEREMPUAN") ? "PEREMPUAN" : "LAKI_LAKI",
          foto: null,
          role: role.toUpperCase() as any,
          no_hp,
          email,
          status,
          theme_preference: "SYSTEM",
        };
      })
    );

    const duplicateUsername = isDuplicate(data.map((item) => item.username));
    const duplicateEmail = isDuplicate(data.filter((item) => item.email).map((item) => item.email as string));

    if (duplicateUsername.length > 0 || duplicateEmail.length > 0) {
      return NextResponse.json(
        { success: false, message: "Username atau Email duplikat di Excel", duplicateUsername, duplicateEmail },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.user.findFirst({
        where: { OR: [{ username: item.username }, ...(item.email ? [{ email: item.email }] : [])] },
      });

      if (exists) {
        throw new Error(`User dengan username "${item.username}" atau email "${item.email ?? "-"}" sudah ada`);
      }
    }

    const result = await prisma.user.createMany({ data: data as any });

    return NextResponse.json({ success: true, message: "Import User berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT USER ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import User gagal" }, { status: 500 });
  }
}
