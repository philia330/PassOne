import { PrismaClient, Role, JenisKelamin } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      kode_user: "USR001",
      nama: "Administrator",
      username: "admin",
      email: "admin@passnet.id",
      password: hashedPassword,
      jkl: JenisKelamin.LAKI_LAKI,
      role: Role.ADMIN,
      status: true,
    },
  });

  console.log("✅ Admin berhasil dibuat");
  console.log("📧 Username :", admin.username);
  console.log("📧 Email    :", admin.email);
  console.log("🔑 Password : admin123");
  console.log("👤 Role     :", admin.role);
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });