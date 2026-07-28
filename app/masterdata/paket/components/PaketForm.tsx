"use client";

import { Tag, Package, Gauge, Wallet, FileText, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaketData } from "@/types/paket";

interface PaketFormProps {
  defaultValues?: PaketData;
  kodeOtomatis?: string;
}

export const PaketForm = ({ defaultValues, kodeOtomatis }: PaketFormProps) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Kode Paket - full width */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label
          htmlFor="kode_paket_display"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Tag size={13} className="text-purple-500" /> Kode Paket
        </Label>
        <div className="relative">
          <Input
            id="kode_paket_display"
            value={defaultValues?.kode_paket ?? kodeOtomatis ?? ""}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-mono font-semibold text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <input
          type="hidden"
          name="kode_paket"
          value={defaultValues?.kode_paket ?? kodeOtomatis ?? ""}
        />
        <p className="text-xs text-slate-400">Dibuat otomatis, tidak bisa diubah manual</p>
      </div>

      {/* Nama Paket - full width */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label
          htmlFor="nama_paket"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Package size={13} className="text-purple-500" /> Nama Paket
        </Label>
        <Input
          id="nama_paket"
          name="nama_paket"
          placeholder="Paket Basic"
          defaultValue={defaultValues?.nama_paket}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      {/* Kecepatan */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="kecepatan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Gauge size={13} className="text-purple-500" /> Kecepatan
        </Label>
        <Input
          id="kecepatan"
          name="kecepatan"
          placeholder="20 Mbps"
          defaultValue={defaultValues?.kecepatan}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      {/* Harga */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="harga"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Wallet size={13} className="text-purple-500" /> Harga
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
            Rp
          </span>
          <Input
            id="harga"
            name="harga"
            type="number"
            placeholder="150000"
            defaultValue={defaultValues?.harga}
            className="rounded-2xl h-12 pl-10 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
            required
          />
        </div>
      </div>

      {/* Keterangan - full width */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label
          htmlFor="keterangan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <FileText size={13} className="text-purple-500" /> Keterangan
        </Label>
        <textarea
          id="keterangan"
          name="keterangan"
          rows={3}
          placeholder="Keterangan tambahan (opsional)"
          defaultValue={defaultValues?.keterangan ?? ""}
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none"
        />
      </div>
    </div>
  );
};