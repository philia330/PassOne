import { redirect } from "next/navigation";
import { Users, UserX } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { auth } from "@/lib/auth";
import { getUsers } from "./actions";

import { UserFormDialog } from "./components/UserFormDialog";
import { DeleteUserDialog } from "./components/DeleteUserDialog";
import { UserSearch } from "./components/UserSearch";
import { UserPagination } from "./components/UserPagination";
import EmptyState from "@/components/shared/empty-state";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const {
    data: users,
    total,
    totalPages,
  } = await getUsers(search, page);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">

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
              <h2 className="mt-2 text-4xl font-bold sm:text-5xl">{total}</h2>
              <p className="mt-1 text-sm text-white/80">User Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 sm:p-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table / Card List */}
      <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <CardContent className="space-y-6 p-4 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <UserSearch defaultValue={search} />
            <UserFormDialog mode="create" />
          </div>

          {users.length === 0 ? (
            <EmptyState
              icon={UserX}
              title={search ? "Tidak ditemukan" : "Belum ada data user"}
              description={
                search
                  ? `Tidak ada user yang cocok dengan pencarian "${search}".`
                  : "Mulai tambahkan user pertama untuk mengelola akses tim kamu."
              }
            />
          ) : (
            <>
              {/* ============ DESKTOP: TABEL ============ */}
              <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                      <TableHead className="dark:text-slate-400">Kode</TableHead>
                      <TableHead className="dark:text-slate-400">Foto</TableHead>
                      <TableHead className="dark:text-slate-400">Nama</TableHead>
                      <TableHead className="dark:text-slate-400">Username</TableHead>
                      <TableHead className="dark:text-slate-400">Email</TableHead>
                      <TableHead className="dark:text-slate-400">Jenis Kelamin</TableHead>
                      <TableHead className="dark:text-slate-400">Role</TableHead>
                      <TableHead className="dark:text-slate-400">No HP</TableHead>
                      <TableHead className="dark:text-slate-400">Status</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id_user}
                        className="hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="font-medium dark:text-slate-200">
                          {user.kode_user}
                        </TableCell>

                        <TableCell>
                          <div className="h-12 w-12 overflow-hidden rounded-full border bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            {user.foto ? (
                              <Image
                                src={user.foto}
                                alt={user.nama}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                                {user.nama.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="dark:text-slate-300">{user.nama}</TableCell>
                        <TableCell className="dark:text-slate-300">{user.username}</TableCell>
                        <TableCell className="dark:text-slate-300">{user.email ?? "-"}</TableCell>
                        <TableCell className="dark:text-slate-300">
                          {user.jkl === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                        </TableCell>

                        <TableCell>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                            {user.role}
                          </span>
                        </TableCell>

                        <TableCell className="dark:text-slate-300">{user.no_hp ?? "-"}</TableCell>

                        <TableCell>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.status
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                          >
                            {user.status ? "Aktif" : "Nonaktif"}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <UserFormDialog mode="edit" data={user} />
                            <DeleteUserDialog id={user.id_user} name={user.nama} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ============ MOBILE: CARD LIST ============ */}
              <div className="space-y-3 md:hidden">
                {users.map((user) => (
                  <div
                    key={user.id_user}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        {user.foto ? (
                          <Image
                            src={user.foto}
                            alt={user.nama}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-400 dark:text-slate-500">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                              {user.nama}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{user.kode_user}</p>
                          </div>

                          <div className="flex flex-shrink-0 gap-1">
                            <UserFormDialog mode="edit" data={user} />
                            <DeleteUserDialog id={user.id_user} name={user.nama} />
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              user.status
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                          >
                            {user.status ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                          <p>👤 {user.username}</p>
                          <p>✉️ {user.email ?? "-"}</p>
                          <p>📱 {user.no_hp ?? "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end">
            <UserPagination page={page} totalPages={totalPages} />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}