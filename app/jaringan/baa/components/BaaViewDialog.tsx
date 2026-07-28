"use client";

import {
  Eye,
  Tag,
  Calendar,
  ClipboardList,
  UserCog,
  Router,
  GitBranch,
  Wifi,
  Hash,
  Gauge,
  Download,
  Upload,
  Timer,
  StickyNote,
  Image as ImageIcon,
  Boxes,
  Users,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { BaaData, StatusBaa } from "@/types/baa";

interface BaaViewDialogProps {
  baa: BaaData;
}

const STATUS_LABEL: Record<StatusBaa, string> = {
  PENDING: "Pending",
  PROSES: "Proses",
  SELESAI: "Selesai",
};

const STATUS_BADGE_CLASS: Record<StatusBaa, string> = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  PROSES: "bg-sky-100 text-sky-700 border-sky-200",
  SELESAI: "bg-purple-100 text-purple-700 border-purple-200",
};

function formatTanggal(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon size={15} className="text-purple-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value ?? "-"}</p>
      </div>
    </div>
  );
}

export const BaaViewDialog = ({ baa }: BaaViewDialogProps) => {
  // Hitung total teknisi tambahan
  const totalTeknisiTambahan = baa.teknisiTambahan?.length || 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[85vh] sm:max-w-[640px] sm:rounded-3xl sm:p-6
        "
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="flex items-center justify-between gap-3 pr-6">
            <span className="flex items-center gap-2 text-base sm:text-lg">
              <Tag size={18} className="text-purple-500" />
              {baa.kode_baa}
            </span>
            <div className="flex items-center gap-2">
              <Badge className={`rounded-full border font-semibold ${STATUS_BADGE_CLASS[baa.status]}`}>
                {STATUS_LABEL[baa.status]}
              </Badge>
              <Link href={`/jaringan/baa/${baa.id_baa}`} target="_blank">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-purple-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-0">
          <div className="space-y-1 divide-y divide-slate-100">
            {/* DATA INSTALASI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 py-1">
              <InfoRow
                icon={Calendar}
                label="Tanggal Instalasi"
                value={formatTanggal(baa.tanggal_instalasi)}
              />
              <InfoRow
                icon={ClipboardList}
                label="FAB / Pelanggan"
                value={
                  baa.fab ? `${baa.fab.kode_fab} — ${baa.fab.nama_pelanggan}` : `ID FAB #${baa.id_fab}`
                }
              />
            </div>

            {/* TEKNISI - UTAMA + TAMBAHAN */}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-1">
                <Users size={15} className="text-purple-500" />
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Teknisi</p>
                {totalTeknisiTambahan > 0 && (
                  <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0">
                    +{totalTeknisiTambahan} tambahan
                  </Badge>
                )}
              </div>

              {/* Teknisi Utama */}
              <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2 mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">Utama</p>
                <p className="text-sm font-semibold text-slate-800">
                  {baa.users ? baa.users.nama : `ID Teknisi #${baa.id_user}`}
                </p>
              </div>

              {/* Teknisi Tambahan */}
              {baa.teknisiTambahan && baa.teknisiTambahan.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">
                    Tambahan
                  </p>
                  {baa.teknisiTambahan.map((t) => (
                    <div
                      key={t.id_baa_teknisi}
                      className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {t.users?.nama || `ID #${t.id_user}`}
                      </span>
                      <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0">
                        Tambahan
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {!baa.teknisiTambahan || baa.teknisiTambahan.length === 0 ? (
                <p className="text-xs text-slate-400 italic ml-1">Tidak ada teknisi tambahan</p>
              ) : null}
            </div>

            {/* PERANGKAT JARINGAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
              <InfoRow icon={Router} label="OLT" value={baa.olt?.nama_olt ?? `ID #${baa.id_olt}`} />
              <InfoRow icon={GitBranch} label="ODP" value={baa.odp?.nama_odp ?? `ID #${baa.id_odp}`} />
              <InfoRow
                icon={Wifi}
                label="ONT"
                value={baa.ont?.serial_number ?? `ID #${baa.id_ont}`}
              />
              <InfoRow
                icon={Hash}
                label="Port OLT / ODP"
                value={`${baa.port_olt ?? "-"} / ${baa.port_odp ?? "-"}`}
              />
            </div>

            {/* HASIL PENGUKURAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
              <InfoRow
                icon={Gauge}
                label="RX / TX Power (dBm)"
                value={`${baa.rx_power_dbm ?? "-"} / ${baa.tx_power_dbm ?? "-"}`}
              />
              <InfoRow icon={Timer} label="Ping" value={baa.ping_ms ? `${baa.ping_ms} ms` : "-"} />
              <InfoRow icon={Download} label="Speed Download" value={baa.speed_download ?? "-"} />
              <InfoRow icon={Upload} label="Speed Upload" value={baa.speed_upload ?? "-"} />
            </div>

            {/* CATATAN & FOTO */}
            <div className="pt-1">
              <InfoRow icon={StickyNote} label="Catatan Teknisi" value={baa.catatan ?? "-"} />
              {baa.foto_instalasi && (
                <InfoRow
                  icon={ImageIcon}
                  label="Foto Instalasi"
                  value={
                    <a
                      href={baa.foto_instalasi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 underline underline-offset-2"
                    >
                      Lihat foto
                    </a>
                  }
                />
              )}
            </div>

            {/* DAFTAR MATERIAL */}
            <div className="pt-3 pb-4 sm:pb-0">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                <Boxes size={13} className="text-purple-500" /> Material yang Dipakai
              </p>

              {baa.baadetail?.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-3 text-center">
                  Tidak ada material yang dicatat pada instalasi ini.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {baa.baadetail?.map((d) => (
                    <div
                      key={d.id_baa_detail}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {d.material?.nama_material ?? `Material #${d.id_material}`}
                        </p>
                        {d.keterangan && (
                          <p className="text-xs text-slate-400 truncate">{d.keterangan}</p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-sm font-semibold text-purple-600 ml-3">
                        {d.jumlah} {d.material?.satuan ?? ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};