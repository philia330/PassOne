import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getUsers } from "./actions";
import { prisma } from "@/lib/prisma";
import { UserSortableTable } from "./components/UserSortableTable";
import EmptyState from "@/components/shared/empty-state";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    highlight?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const highlightId = params?.highlight ? Number(params.highlight) : null;

  // Hitung total SEMUA data (tanpa filter) untuk card statistik
  const [totalCount, { data: users, total, totalPages }] = await Promise.all([
    prisma.user.count(),
    getUsers(search, page),
  ]);

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama ?? "",
    role: session.user.role,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">

      <PageHeader
        title="Data User"
        description="Kelola data pengguna PASSNET"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-5 sm:p-6">
            <div>
              <p className="text-sm text-white/80">Total User</p>
              <h2 className="mt-2 text-4xl font-bold sm:text-5xl">{totalCount}</h2>
              <p className="mt-1 text-sm text-white/80">User Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 sm:p-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Tidak ditemukan" : "Belum ada data user"}
          description={
            search
              ? `Tidak ada user yang cocok dengan pencarian "${search}".`
              : "Mulai tambahkan user pertama untuk mengelola akses tim kamu."
          }
        />
      ) : (
        <UserSortableTable initialData={users} defaultValue={search} currentUser={currentUser} />
      )}
    </div>
  );
}