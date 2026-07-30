import { notFound, redirect } from "next/navigation";
import { BaaImageDialog } from "@/app/jaringan/baa/components/BaaImageDialog";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  UserCog,
  Router,
  Gauge,
  Download,
  Upload,
  StickyNote,
  Image as ImageIcon,
  Boxes,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getBaaById } from "@/app/jaringan/baa/actions"; // Import dari actions

// ✅ FIX: params sekarang berupa Promise di Next.js 15/16 (async params)
interface BaaDetailPageProps {
  params: Promise<{
    id_baa: string;
  }>;
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

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PROSES: <AlertCircle className="h-4 w-4" />,
  SELESAI: <CheckCircle className="h-4 w-4" />,
};

function formatTanggal(date: Date) {
  return format(new Date(date), "dd MMMM yyyy", { locale: id });
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ================================================================
// HELPER: Konversi Decimal ke number
// ================================================================
function isDecimalObject(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  );
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (isDecimalObject(value)) {
    return value.toNumber();
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export default async function BaaDetailPage({ params }: BaaDetailPageProps) {
  // ✅ Proteksi role
  const session = await auth();
  const allowedRoles = [Role.ADMIN, Role.LEADER, Role.TEKNISI];

  if (!session || !allowedRoles.includes(session.user?.role as Role)) {
    redirect("/dashboard");
  }

  // ✅ FIX: await params dulu sebelum akses propertinya
  const { id_baa } = await params;
  const id = parseInt(id_baa);

  if (isNaN(id)) {
    notFound();
  }

  // Gunakan getBaaId dari actions.ts
  const baa = await getBaaById(id);

  if (!baa) {
    notFound();
  }

  // Konversi Decimal ke number
  const rxPower = toNumber(baa.rx_power_dbm);
  const txPower = toNumber(baa.tx_power_dbm);
  const ping = toNumber(baa.ping_ms);

  const totalMaterial = baa.baadetail.reduce((sum, d) => sum + d.jumlah, 0);
  const totalHarga = baa.baadetail.reduce(
    (sum, d) => sum + (d.material?.harga ? Number(d.material.harga) * d.jumlah : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />

      <div className="relative p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        <Link href="/jaringan/baa">
          <Button variant="ghost" className="rounded-xl gap-2 text-slate-600 hover:text-purple-600">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar BAA
          </Button>
        </Link>

        {/* Header */}
        <Card className="relative overflow-hidden rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{baa.kode_baa}</h1>
                <Badge className={`rounded-full border font-semibold ${STATUS_BADGE[baa.status]}`}>
                  <span className="flex items-center gap-1">
                    {STATUS_ICON[baa.status]}
                    {STATUS_LABEL[baa.status]}
                  </span>
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {baa.fab?.nama_pelanggan} • {formatTanggal(baa.tanggal_instalasi)}
              </p>
            </div>

            <div className="flex gap-2">
              
            </div>
          </div>
        </Card>

        {/* Grid Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Informasi Pelanggan
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama</span>
                <span className="font-semibold text-slate-900">{baa.fab?.nama_pelanggan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode FAB</span>
                <span className="font-mono font-semibold text-purple-700">{baa.fab?.kode_fab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket</span>
                <span className="font-semibold text-slate-900">{baa.fab?.paket?.nama_paket}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Area</span>
                <span className="font-semibold text-slate-900">{baa.fab?.area?.nama_area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sales</span>
                <span className="font-semibold text-slate-900">{baa.fab?.users?.nama}</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-purple-500" />
              Teknisi
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                <p className="text-xs text-purple-600 font-medium">Teknisi Utama</p>
                <p className="font-semibold text-slate-900">{baa.users?.nama}</p>
              </div>
              {baa.teknisiTambahan.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">Teknisi Tambahan</p>
                  {baa.teknisiTambahan.map((t) => (
                    <div key={t.id_baa_teknisi} className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{t.users?.nama}</span>
                     
                    </div>
                  ))}
                </div>
              )}
              {baa.teknisiTambahan.length === 0 && (
                <p className="text-xs text-slate-400 italic">Tidak ada teknisi tambahan</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
            <Router className="h-4 w-4 text-purple-500" />
            Perangkat Jaringan
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-400">OLT</p>
              <p className="font-semibold text-sm text-slate-800 truncate">{baa.olt?.nama_olt}</p>
              <p className="text-xs text-slate-500">Port: {baa.port_olt ?? "-"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-400">ODP</p>
              <p className="font-semibold text-sm text-slate-800 truncate">{baa.odp?.nama_odp}</p>
              <p className="text-xs text-slate-500">Port: {baa.port_odp ?? "-"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-400">ONT</p>
              <p className="font-semibold text-sm text-slate-800 truncate font-mono">{baa.ont?.serial_number}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-400">Tanggal Instalasi</p>
              <p className="font-semibold text-sm text-slate-800">{formatTanggal(baa.tanggal_instalasi)}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-500" />
            Hasil Pengukuran
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400">RX Power</p>
              <p className="font-bold text-slate-800">{rxPower !== null ? `${rxPower} dBm` : "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">TX Power</p>
              <p className="font-bold text-slate-800">{txPower !== null ? `${txPower} dBm` : "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Ping</p>
              <p className="font-bold text-slate-800">{ping !== null ? `${ping} ms` : "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Status</p>
              <Badge className={`rounded-lg font-semibold ${STATUS_BADGE[baa.status]}`}>
                {STATUS_LABEL[baa.status]}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Download className="h-3 w-3" /> Download
              </p>
              <p className="font-bold text-slate-800">{baa.speed_download ?? "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Upload className="h-3 w-3" /> Upload
              </p>
              <p className="font-bold text-slate-800">{baa.speed_upload ?? "-"}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-purple-500" />
              Material yang Dipakai
            </h3>
            <Badge variant="outline" className="rounded-xl">{baa.baadetail.length} item</Badge>
          </div>
          {baa.baadetail.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Tidak ada material yang dicatat pada instalasi ini.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Nama Material</th>
                      <th className="text-center py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Jumlah</th>
                      <th className="text-right py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Harga</th>
                      <th className="text-right py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Total</th>
                      <th className="text-left py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baa.baadetail.map((detail) => (
                      <tr key={detail.id_baa_detail} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-800">{detail.material?.nama_material}</td>
                        <td className="text-center py-2.5">{detail.jumlah} {detail.material?.satuan}</td>
                        <td className="text-right py-2.5 text-slate-600">
                          {detail.material?.harga ? formatRupiah(Number(detail.material.harga)) : "-"}
                        </td>
                        <td className="text-right py-2.5 font-semibold text-purple-700">
                          {detail.material?.harga ? formatRupiah(Number(detail.material.harga) * detail.jumlah) : "-"}
                        </td>
                        <td className="py-2.5 text-slate-500 text-sm">{detail.keterangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200">
                      <td colSpan={3} className="py-3 text-right font-bold text-slate-900">Total</td>
                      <td className="py-3 text-right font-bold text-purple-700">{formatRupiah(totalHarga)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-3 text-xs text-slate-400">Total item: {totalMaterial} unit</div>
            </>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-purple-500" />
              Catatan Teknisi
            </h3>
            {baa.catatan ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{baa.catatan}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Tidak ada catatan</p>
            )}
          </Card>

          <Card className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-purple-500" />
              Foto Instalasi
            </h3>
          {baa.foto_instalasi ? (
  <BaaImageDialog
    fotoUrl={baa.foto_instalasi}
    kodeBaa={baa.kode_baa}
    trigger={
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <div className="relative w-full h-80">
          <Image
            src={baa.foto_instalasi}
            alt={`Foto instalasi ${baa.kode_baa}`}
            fill
            className="object-cover"
            unoptimized={true}
          />
        </div>
        <div className="p-2 bg-slate-50 text-center">
          <span className="text-sm text-purple-600 hover:underline">
            Lihat foto full size
          </span>
        </div>
      </div>
    }
  />
) : (
  <p className="text-sm text-slate-400 italic">Tidak ada foto</p>
)}
          </Card>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2">
          <p>
            Dibuat: {format(new Date(baa.createdAt), "dd MMM yyyy HH:mm")} • 
            Terakhir diubah: {format(new Date(baa.updatedAt), "dd MMM yyyy HH:mm")}
          </p>
        </div>
      </div>
    </div>
  );
}