"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "./UserFormDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserSearch } from "./UserSearch";
import { UserPagination } from "./UserPagination";
import ImagePreview from "@/components/shared/image-preview";

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
  LEADER: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  SALES: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  TEKNISI: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  LOGISTIK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const DEFAULT_ROLE_STYLE = "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300";

type User = {
  id_user: number;
  kode_user: string;
  nama: string;
  username: string;
  email: string | null;
  foto: string | null;
  jkl: "LAKI_LAKI" | "PEREMPUAN";
  role: "ADMIN" | "LEADER" | "SALES" | "TEKNISI" | "LOGISTIK";
  no_hp: string | null;
  status: boolean;
};

const PAGE_SIZE = 10;

export function UserSortableTable({
  initialData,
  defaultValue,
}: {
  initialData: User[];
  defaultValue: string;
}) {
  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return initialData.filter(
      (user) =>
        user.kode_user.toLowerCase().includes(query) ||
        user.nama.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        (user.email?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_user.localeCompare(b.kode_user, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserSearch defaultValue={search} />
          <UserFormDialog mode="create" />
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                <TableHead className="dark:text-slate-400">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                  >
                    Kode
                    {sortOrder === "asc" ? (
                      <ArrowUp size={16} className="text-purple-500" />
                    ) : (
                      <ArrowDown size={16} className="text-purple-500" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-400">Foto</TableHead>
                <TableHead className="dark:text-slate-400">Nama</TableHead>
                <TableHead className="dark:text-slate-400">Username</TableHead>
                <TableHead className="dark:text-slate-400">Email</TableHead>
                <TableHead className="dark:text-slate-400">Role</TableHead>
                <TableHead className="dark:text-slate-400">Status</TableHead>
                <TableHead className="text-center dark:text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada user yang cocok" : "Belum ada user"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((user) => (
                  <TableRow key={user.id_user} className="hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium dark:text-slate-200">{user.kode_user}</TableCell>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-full border bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        {user.foto ? (
                          <ImagePreview src={user.foto} alt={user.nama} width={40} height={40} className="h-full w-full object-cover" />
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
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE_STYLES[user.role] ?? DEFAULT_ROLE_STYLE}`}>{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                        {user.status ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <UserFormDialog mode="edit" data={user} />
                        <DeleteUserDialog id={user.id_user} name={user.nama} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {paginated.map((user) => (
            <div key={user.id_user} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  {user.foto ? (
                    <img src={user.foto} alt={user.nama} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-400 dark:text-slate-500">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold dark:text-slate-100">{user.nama}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{user.kode_user}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <UserFormDialog mode="edit" data={user} />
                      <DeleteUserDialog id={user.id_user} name={user.nama} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_STYLES[user.role] ?? DEFAULT_ROLE_STYLE}`}>{user.role}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.status ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                      {user.status ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <UserPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
