"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Prisma } from "@prisma/client";

type BaaDetail = {
  id_baa_detail: number;
  jumlah: number;
  keterangan: string | null;
  material: {
    nama_material: string;
    harga: Prisma.Decimal | number;
    satuan: string;
  } | null;
};

type BaaData = {
  id_baa: number;
  kode_baa: string;
  tanggal_instalasi: Date;
  status: string;
  rx_power_dbm: Prisma.Decimal | number | null;
  tx_power_dbm: Prisma.Decimal | number | null;
  ping_ms: Prisma.Decimal | number | null;
  speed_download: string | null;
  speed_upload: string | null;
  port_olt: number | null;
  port_odp: number | null;
  fab: {
    kode_fab: string;
    nama_pelanggan: string;
    alamat: string | null;
    no_hp: string | null;
    paket: { nama_paket: string; kecepatan: string; harga: Prisma.Decimal | number } | null;
    area: { nama_area: string } | null;
    users: { nama: string } | null;
  } | null;
  users: { nama: string; no_hp: string | null } | null;
  teknisiTambahan: Array<{
    id_baa_teknisi: number;
    users: { nama: string } | null;
  }>;
  olt: { nama_olt: string } | null;
  odp: { nama_odp: string } | null;
  ont: { serial_number: string } | null;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

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

interface BaaInvoiceProps {
  baa: BaaData;
  details: BaaDetail[];
}

export default function BaaInvoice({ baa, details }: BaaInvoiceProps) {
  const totalHarga = details.reduce(
    (sum, d) => sum + (d.material?.harga ? toNumber(d.material.harga) * d.jumlah : 0),
    0
  );

  const teknisiUtama = baa.users?.nama || "-";
  const teknisiTambahan = baa.teknisiTambahan
    .map((t) => t.users?.nama)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="invoice-container bg-white p-8">
      {/* Header Invoice */}
      <div className="mb-8 flex items-start justify-between border-b-2 border-purple-600 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">INVOICE</h1>
          <p className="mt-1 text-sm text-slate-500">BAA - Berita Acara Instalasi</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800">PT PASSNET INDONESIA</h2>
          <p className="text-sm text-slate-500">ISP Management Platform</p>
        </div>
      </div>

      {/* Info Invoice */}
      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Informasi Pelanggan
          </h3>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">{baa.fab?.nama_pelanggan}</p>
            <p className="text-slate-600">{baa.fab?.alamat || "-"}</p>
            <p className="text-slate-600">No. HP: {baa.fab?.no_hp || "-"}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Detail Invoice
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-500">No. BAA:</span>{" "}
              <span className="font-semibold">{baa.kode_baa}</span>
            </p>
            <p>
              <span className="text-slate-500">No. FAB:</span>{" "}
              <span className="font-semibold">{baa.fab?.kode_fab}</span>
            </p>
            <p>
              <span className="text-slate-500">Tanggal:</span>{" "}
              {formatTanggal(baa.tanggal_instalasi)}
            </p>
            <p>
              <span className="text-slate-500">Paket:</span>{" "}
              {baa.fab?.paket?.nama_paket} ({baa.fab?.paket?.kecepatan})
            </p>
          </div>
        </div>
      </div>

      {/* Teknisi Info */}
      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Teknisi
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-500">Utama:</span> {teknisiUtama}
            </p>
            {teknisiTambahan && (
              <p>
                <span className="text-slate-500">Tambahan:</span> {teknisiTambahan}
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sales
          </h3>
          <div className="space-y-1 text-sm">
            <p>{baa.fab?.users?.nama || "-"}</p>
            <p className="text-slate-500">{baa.fab?.area?.nama_area || "-"}</p>
          </div>
        </div>
      </div>

      {/* Perangkat Jaringan */}
      <div className="mb-8 rounded-lg bg-slate-50 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Informasi Perangkat Jaringan
        </h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500">OLT</p>
            <p className="font-semibold">{baa.olt?.nama_olt || "-"}</p>
            <p className="text-xs text-slate-500">Port: {baa.port_olt || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">ODP</p>
            <p className="font-semibold">{baa.odp?.nama_odp || "-"}</p>
            <p className="text-xs text-slate-500">Port: {baa.port_odp || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">ONT SN</p>
            <p className="font-semibold font-mono text-xs">{baa.ont?.serial_number || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">Hasil Ukur</p>
            <p className="font-semibold">
              RX: {baa.rx_power_dbm ? `${toNumber(baa.rx_power_dbm)} dBm` : "-"}
            </p>
            <p className="text-xs text-slate-500">
              TX: {baa.tx_power_dbm ? `${toNumber(baa.tx_power_dbm)} dBm` : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Material */}
      <div className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Material yang Dipakai
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-2 text-left font-semibold text-slate-700">No</th>
              <th className="py-2 text-left font-semibold text-slate-700">Nama Material</th>
              <th className="py-2 text-center font-semibold text-slate-700">Jumlah</th>
              <th className="py-2 text-right font-semibold text-slate-700">Harga</th>
              <th className="py-2 text-right font-semibold text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {details.map((detail, index) => (
              <tr key={detail.id_baa_detail} className="border-b border-slate-100">
                <td className="py-2 text-slate-600">{index + 1}</td>
                <td className="py-2">
                  <span className="font-medium">{detail.material?.nama_material}</span>
                  {detail.keterangan && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({detail.keterangan})
                    </span>
                  )}
                </td>
                <td className="py-2 text-center">
                  {detail.jumlah} {detail.material?.satuan}
                </td>
                <td className="py-2 text-right text-slate-600">
                  {detail.material?.harga ? formatRupiah(toNumber(detail.material.harga)) : "-"}
                </td>
                <td className="py-2 text-right font-medium">
                  {detail.material?.harga
                    ? formatRupiah(toNumber(detail.material.harga) * detail.jumlah)
                    : "-"}
                </td>
              </tr>
            ))}
            {details.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  Tidak ada material yang dicatat
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td colSpan={4} className="py-3 text-right font-bold text-slate-900">
                TOTAL
              </td>
              <td className="py-3 text-right font-bold text-purple-700">
                {formatRupiah(totalHarga)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Speed Test Results */}
      {(baa.speed_download || baa.speed_upload || baa.ping_ms) && (
        <div className="mb-8 rounded-lg bg-slate-50 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hasil Speed Test
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500">Download</p>
              <p className="text-lg font-bold text-slate-800">
                {baa.speed_download || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Upload</p>
              <p className="text-lg font-bold text-slate-800">
                {baa.speed_upload || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ping</p>
              <p className="text-lg font-bold text-slate-800">
                {baa.ping_ms ? `${toNumber(baa.ping_ms)} ms` : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tanda Tangan */}
      <div className="mt-12 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="mb-16 h-20 border-b border-slate-300"></div>
          <p className="text-sm font-semibold">Pelanggan</p>
          <p className="text-xs text-slate-500">{baa.fab?.nama_pelanggan}</p>
        </div>
        <div>
          <div className="mb-16 h-20 border-b border-slate-300"></div>
          <p className="text-sm font-semibold">Teknisi</p>
          <p className="text-xs text-slate-500">{teknisiUtama}</p>
        </div>
        <div>
          <div className="mb-16 h-20 border-b border-slate-300"></div>
          <p className="text-sm font-semibold">Supervisor</p>
          <p className="text-xs text-slate-500">Leader / Admin</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        <p>Dokumen ini dicetak dari Aplikasi Passnet pada {format(new Date(), "dd MMM yyyy HH:mm", { locale: id })}</p>
      </div>
    </div>
  );
}
