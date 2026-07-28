import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Search, UserCog } from "lucide-react";
import { addTeknisiTambahan } from "@/app/jaringan/baa/actions";

interface BaaTeknisiTambahPageProps {
  params: {
    id_baa: string;
  };
  searchParams: {
    q?: string;
  };
}

export default async function BaaTeknisiTambahPage({
  params,
  searchParams,
}: BaaTeknisiTambahPageProps) {
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
      user: {
        select: {
          id_user: true,
          nama: true,
        },
      },
      teknisiTambahan: {
        select: {
          id_user: true,
        },
      },
    },
  });

  if (!baa) {
    notFound();
  }

  const existingIds = baa.teknisiTambahan.map((t) => t.id_user);
  existingIds.push(baa.id_user);

  const searchQuery = searchParams.q || "";
  const teknisiTersedia = await prisma.user.findMany({
    where: {
      role: "TEKNISI",
      status: true,
      NOT: {
        id_user: {
          in: existingIds,
        },
      },
      OR: [
        { nama: { contains: searchQuery } },
        { username: { contains: searchQuery } },
        { email: { contains: searchQuery } },
      ],
    },
    select: {
      id_user: true,
      nama: true,
      username: true,
      email: true,
      foto: true,
    },
    orderBy: {
      nama: "asc",
    },
  });

  async function handleAddTeknisi(formData: FormData) {
    "use server";

    const userId = Number(formData.get("id_user"));
    if (!userId) {
      throw new Error("Pilih teknisi terlebih dahulu");
    }

    await addTeknisiTambahan(id, userId);
    redirect(`/jaringan/baa/${id}/teknisi`);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        <Link href={`/jaringan/baa/${id}/teknisi`}>
          <Button variant="ghost" className="rounded-xl gap-2 text-slate-600 hover:text-purple-600">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Manajemen Teknisi
          </Button>
        </Link>

        <Card className="relative overflow-hidden rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-purple-500" />
                Tambah Teknisi
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {baa.kode_baa} • {baa.fab?.nama_pelanggan}
              </p>
            </div>
            <Badge className="rounded-full flex items-center gap-1">
              <UserCog className="h-3 w-3" />
              Teknisi Utama: {baa.user?.nama}
            </Badge>
          </div>
        </Card>

        <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                name="q"
                placeholder="Cari teknisi berdasarkan nama atau username..."
                defaultValue={searchQuery}
                className="rounded-2xl h-12 pl-11 border-slate-200"
              />
            </div>
            <Button
              type="submit"
              className="h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white px-6"
            >
              Cari
            </Button>
          </form>
        </Card>

        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold text-slate-700">
              Teknisi Tersedia ({teknisiTersedia.length})
            </h2>
          </div>

          {teknisiTersedia.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <UserPlus className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="font-semibold text-slate-600">Tidak ada teknisi tersedia</p>
              <p className="text-sm">
                {searchQuery
                  ? "Coba dengan kata kunci lain"
                  : "Semua teknisi sudah ditambahkan ke BAA ini"}
              </p>
            </div>
          ) : (
            <form action={handleAddTeknisi}>
              <div className="divide-y divide-slate-100">
                {teknisiTersedia.map((teknisi) => (
                  <div
                    key={teknisi.id_user}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 flex items-center justify-center text-white font-bold text-sm">
                        {teknisi.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{teknisi.nama}</p>
                        <p className="text-sm text-slate-500">
                          @{teknisi.username} • {teknisi.email || "-"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      name="id_user"
                      value={teknisi.id_user}
                      className="rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white"
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Tambahkan
                    </Button>
                  </div>
                ))}
              </div>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Tambah Teknisi BAA
        </p>
      </div>
    </div>
  );
}