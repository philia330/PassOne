import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  UserCog,
  Calendar,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface BaaTeknisiDetailPageProps {
  params: {
    id_baa: string;
    id_teknisi: string;
  };
}

function formatTanggal(date: Date) {
  return format(new Date(date), "dd MMMM yyyy", { locale: id });
}

function formatDateTime(date: Date) {
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: id });
}

export default async function BaaTeknisiDetailPage({
  params,
}: BaaTeknisiDetailPageProps) {
  const idBaa = parseInt(params.id_baa);
  const idTeknisi = parseInt(params.id_teknisi);

  if (isNaN(idBaa) || isNaN(idTeknisi)) {
    notFound();
  }

  // Ambil data BAA
  const baa = await prisma.baa.findUnique({
    where: { id_baa: idBaa },
    include: {
      fab: {
        select: {
          nama_pelanggan: true,
          kode_fab: true,
        },
      },
      user: {
        // Teknisi Utama
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
          user: {
            select: {
              id_user: true,
              nama: true,
              username: true,
              email: true,
              foto: true,
            },
          },
        },
      },
    },
  });

  if (!baa) {
    notFound();
  }

  // Cari teknisi yang diminta (bisa utama atau tambahan)
  let teknisi = null;
  let isUtama = false;
  let relasi = null;

  if (baa.user?.id_user === idTeknisi) {
    teknisi = baa.user;
    isUtama = true;
  } else {
    const tambahan = baa.teknisiTambahan.find((t) => t.id_user === idTeknisi);
    if (tambahan) {
      teknisi = tambahan.user;
      relasi = tambahan;
      isUtama = false;
    }
  }

  if (!teknisi) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        <Link href={`/jaringan/baa/${idBaa}/teknisi`}>
          <Button variant="ghost" className="rounded-xl gap-2 text-slate-600 hover:text-purple-600">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Teknisi
          </Button>
        </Link>

        <Card className="relative overflow-hidden rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 flex items-center justify-center text-white font-bold text-2xl">
                {teknisi.nama.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{teknisi.nama}</h1>
                  {isUtama ? (
                    <Badge className="bg-purple-100 text-purple-700 rounded-full">
                      <UserCog className="h-3 w-3 mr-1" />
                      Teknisi Utama
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full">
                      <Users className="h-3 w-3 mr-1" />
                      Teknisi Tambahan
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {baa.kode_baa} • {baa.fab?.nama_pelanggan}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              Informasi Teknisi
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Nama Lengkap</span>
                <span className="font-semibold text-slate-900">{teknisi.nama}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Username</span>
                <span className="font-mono font-semibold text-slate-900">@{teknisi.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-900">{teknisi.email || "-"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Role</span>
                <Badge className="bg-purple-100 text-purple-700 rounded-lg font-semibold">
                  {isUtama ? "Teknisi Utama" : "Teknisi Tambahan"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Informasi BAA
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Kode BAA</span>
                <span className="font-mono font-semibold text-purple-700">{baa.kode_baa}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Pelanggan</span>
                <span className="font-semibold text-slate-900">{baa.fab?.nama_pelanggan}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Instalasi</span>
                <span className="font-semibold text-slate-900">{formatTanggal(baa.tanggal_instalasi)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Status</span>
                <Badge className="bg-sky-100 text-sky-700 rounded-lg font-semibold">
                  {baa.status}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {relasi && (
          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Detail Penambahan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-400">Ditambahkan Pada</p>
                <p className="font-semibold text-slate-800">{formatDateTime(relasi.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-400">Status</p>
                <p className="font-semibold text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Aktif
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Link href={`/jaringan/baa/${idBaa}`}>
            <Button variant="outline" className="rounded-xl">
              Lihat Detail BAA
            </Button>
          </Link>
          <Link href={`/jaringan/baa/${idBaa}/teknisi`}>
            <Button variant="outline" className="rounded-xl">
              Kembali ke Daftar Teknisi
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Detail Teknisi BAA
        </p>
      </div>
    </div>
  );
}