import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  UserCog,
  UserPlus,
  UserMinus,
  Users,
  Calendar,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { removeTeknisiTambahan } from "@/app/jaringan/baa/actions";

interface BaaTeknisiPageProps {
  params: {
    id_baa: string;
  };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PROSES: "Proses",
  SELESAI: "Selesai",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  PROSES: "bg-sky-100 text-sky-700 border-sky-200",
  SELESAI: "bg-green-100 text-green-700 border-green-200",
};

function formatTanggal(date: Date) {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
}

export default async function BaaTeknisiPage({ params }: BaaTeknisiPageProps) {
  const id = parseInt(params.id_baa);

  if (isNaN(id)) {
    notFound();
  }

  const baa = await prisma.baa.findUnique({
    where: { id_baa: id },
    include: {
      fab: {
        select: {
          nama_pelanggan: true,
          kode_fab: true,
        },
      },
      users: {
        // ✅ user → users
        select: {
          id_user: true,
          nama: true,
          username: true,
          email: true,
          foto: true,
        },
      },
      teknisiTambahan: {
        include: {
          users: {
            // ✅ user → users
            select: {
              id_user: true,
              nama: true,
              username: true,
              email: true,
              foto: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!baa) {
    notFound();
  }

  const totalTeknisi = 1 + baa.teknisiTambahan.length;

  // Cek teknisi tersedia untuk ditambahkan
  const existingIds = baa.teknisiTambahan.map((t) => t.id_user);
  existingIds.push(baa.users.id_user);

  const teknisiTersedia = await prisma.user.count({
    where: {
      role: "TEKNISI",
      status: true,
      NOT: {
        id_user: {
          in: existingIds,
        },
      },
    },
  });

  async function handleRemoveTeknisi(formData: FormData) {
    "use server";
    const id_baa_teknisi = Number(formData.get("id_baa_teknisi"));
    await removeTeknisiTambahan(id_baa_teknisi);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />

      <div className="relative p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Tombol Kembali */}
        <div className="flex items-center justify-between">
          <Link href={`/jaringan/baa/${id}`}>
            <Button variant="ghost" className="rounded-xl gap-2 text-slate-600 hover:text-purple-600">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Detail BAA
            </Button>
          </Link>

          <Badge className={`rounded-full border font-semibold ${STATUS_BADGE[baa.status]}`}>
            {STATUS_LABEL[baa.status]}
          </Badge>
        </div>

        {/* Header */}
        <Card className="relative overflow-hidden rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">Manajemen Teknisi</h1>
                <Badge variant="outline" className="rounded-full">
                  <Users className="h-3 w-3 mr-1" />
                  {totalTeknisi} teknisi
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {baa.kode_baa} • {baa.fab?.nama_pelanggan}
              </p>
            </div>

            {teknisiTersedia > 0 && (
              <Link href={`/jaringan/baa/${id}/teknisi/tambah`}>
                <Button className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Teknisi
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Daftar Teknisi */}
        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-sm font-semibold text-slate-700">
              Daftar Teknisi yang Bekerja di BAA Ini
            </h2>
            <p className="text-xs text-slate-400">
              Teknisi utama bertanggung jawab penuh atas instalasi ini
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nama
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Username
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Email
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Role
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* Teknisi Utama */}
                <TableRow className="bg-purple-50/50 hover:bg-purple-50">
                  <TableCell className="font-medium text-slate-400">1</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                        {baa.users?.nama?.charAt(0) || "U"}
                      </div>
                      <span className="font-semibold text-slate-900">{baa.users?.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">
                    {baa.users?.username}
                  </TableCell>
                  <TableCell className="text-slate-600">{baa.users?.email || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-purple-100 text-purple-700 rounded-lg font-semibold">
                      <UserCog className="h-3 w-3 mr-1" />
                      Utama
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-slate-400 text-sm">
                    Tidak bisa dihapus
                  </TableCell>
                </TableRow>

                {/* Teknisi Tambahan */}
                {baa.teknisiTambahan.map((t, index) => (
                  <TableRow key={t.id_baa_teknisi} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-400">
                      {index + 2}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                          {t.users?.nama?.charAt(0) || "T"}
                        </div>
                        <span className="font-medium text-slate-800">{t.users?.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {t.users?.username}
                    </TableCell>
                    <TableCell className="text-slate-600">{t.users?.email || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="rounded-lg font-semibold">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Tambahan
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/jaringan/baa/${id}/teknisi/${t.users.id_user}`}>
                          <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <form action={handleRemoveTeknisi}>
                          <input type="hidden" name="id_baa_teknisi" value={t.id_baa_teknisi} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 w-8 p-0"
                            onClick={(e) => {
                              if (!confirm(`Hapus ${t.users?.nama} dari daftar teknisi?`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {baa.teknisiTambahan.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      <UserPlus className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada teknisi tambahan</p>
                      <p className="text-sm">
                        {teknisiTersedia > 0
                          ? "Klik 'Tambah Teknisi' untuk menambahkan"
                          : "Tidak ada teknisi lain yang tersedia"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>Total teknisi: {totalTeknisi}</span>
                <span>•</span>
                <span>Utama: 1</span>
                <span>•</span>
                <span>Tambahan: {baa.teknisiTambahan.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Diperbarui: {formatTanggal(baa.updatedAt)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalTeknisi}</p>
            <p className="text-xs text-slate-500">Total Teknisi</p>
          </div>
          <div className="rounded-2xl bg-white border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-sky-600">{baa.teknisiTambahan.length}</p>
            <p className="text-xs text-slate-500">Teknisi Tambahan</p>
          </div>
          <div className="rounded-2xl bg-white border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{teknisiTersedia}</p>
            <p className="text-xs text-slate-500">Teknisi Tersedia</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Manajemen Teknisi BAA
        </p>
      </div>
    </div>
  );
}