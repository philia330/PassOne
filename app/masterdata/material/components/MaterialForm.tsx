"use client";

import { useState } from "react";
import { Tag, Package, Boxes, AlertTriangle, Ruler, Wallet, FileText, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MaterialData } from "@/types/material";

interface MaterialFormProps {
  defaultValues?: MaterialData;
  kodeOtomatis?: string;
}

export const MaterialForm = ({ defaultValues, kodeOtomatis }: MaterialFormProps) => {
  const [kondisi, setKondisi] = useState<"BAIK" | "RUSAK">(defaultValues?.kondisi ?? "BAIK");

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* Kode Material - full width */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label
          htmlFor="kode_material_display"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Tag size={13} className="text-purple-500" /> Kode Material
        </Label>
        <div className="relative">
          <Input
            id="kode_material_display"
            value={defaultValues?.kode_material ?? kodeOtomatis ?? ""}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-mono font-semibold text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">Dibuat otomatis, tidak bisa diubah manual</p>
      </div>

      {/* Nama Material - full width */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label
          htmlFor="nama_material"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Package size={13} className="text-purple-500" /> Nama Material
        </Label>
        <Input
          id="nama_material"
          name="nama_material"
          placeholder="Masukkan nama material"
          defaultValue={defaultValues?.nama_material}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      {/* Stok */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="stok"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Boxes size={13} className="text-purple-500" /> Stok
        </Label>
        <Input
          id="stok"
          name="stok"
          type="number"
          min={0}
          placeholder="0"
          defaultValue={defaultValues?.stok ?? 0}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      {/* Minimal Stok */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="minimal_stok"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <AlertTriangle size={13} className="text-purple-500" /> Minimal Stok
        </Label>
        <Input
          id="minimal_stok"
          name="minimal_stok"
          type="number"
          min={0}
          placeholder="5"
          defaultValue={defaultValues?.minimal_stok ?? 5}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      {/* Satuan */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="satuan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Ruler size={13} className="text-purple-500" /> Satuan
        </Label>
        <Input
          id="satuan"
          name="satuan"
          placeholder="Masukkan satuan, contoh: Meter, PCS, Unit"
          defaultValue={defaultValues?.satuan}
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
            placeholder="Masukkan harga material"
            defaultValue={defaultValues?.harga}
            className="rounded-2xl h-12 pl-10 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
            required
          />
        </div>
      </div>

      {/* Kondisi - full width di mobile, 1 kolom di desktop */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <AlertTriangle size={13} className="text-purple-500" /> Kondisi
        </Label>
        <Select value={kondisi} onValueChange={(v) => setKondisi((v ?? "BAIK") as "BAIK" | "RUSAK")}>
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BAIK">Baik</SelectItem>
            <SelectItem value="RUSAK">Rusak</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="kondisi" value={kondisi} />
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
          placeholder="Tulis keterangan tambahan di sini (opsional)"
          defaultValue={defaultValues?.keterangan ?? ""}
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none"
        />
      </div>
    </div>
  );
};