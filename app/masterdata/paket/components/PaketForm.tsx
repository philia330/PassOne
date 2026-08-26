"use client";

import { useState, useCallback } from "react";
import { Tag, Package, Gauge, Wallet, FileText, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaketData } from "@/types/paket";
import { validateTextInput, validateNumericInput } from "@/lib/validations/hooks";

interface PaketFormProps {
  defaultValues?: PaketData;
  kodeOtomatis?: string;
}

export const PaketForm = ({ defaultValues, kodeOtomatis }: PaketFormProps) => {
  const [namaPaket, setNamaPaket] = useState(defaultValues?.nama_paket ?? "");
  const [kecepatan, setKecepatan] = useState(defaultValues?.kecepatan ?? "");

  // Handle nama paket change with validation
  const handleNamaPaketChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateTextInput(e.target.value, 100);
      setNamaPaket(sanitized);
    },
    []
  );

  // Handle kecepatan change with validation
  const handleKecepatanChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateTextInput(e.target.value, 50);
      setKecepatan(sanitized);
    },
    []
  );

  // Handle numeric inputs
  const handleNumericChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateNumericInput(e.target.value, 12);
      e.target.value = sanitized;
    },
    []
  );

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
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nama_paket"
          name="nama_paket"
          placeholder="Paket Basic"
          value={namaPaket}
          onChange={handleNamaPaketChange}
          maxLength={100}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
        <p className="text-xs text-slate-400">{namaPaket.length}/100 karakter</p>
      </div>

      {/* Kecepatan */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="kecepatan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Gauge size={13} className="text-purple-500" /> Kecepatan
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="kecepatan"
          name="kecepatan"
          placeholder="20 Mbps"
          value={kecepatan}
          onChange={handleKecepatanChange}
          maxLength={50}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
        <p className="text-xs text-slate-400">Contoh: 20 Mbps, 50 Mbps, 100 Mbps</p>
      </div>

      {/* Harga */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="harga"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Wallet size={13} className="text-purple-500" /> Harga
          <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
            Rp
          </span>
          <Input
            id="harga"
            name="harga"
            type="number"
            min={1}
            placeholder="150000"
            defaultValue={defaultValues?.harga}
            onChange={handleNumericChange}
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
          <span className="text-slate-400 font-normal">(opsional)</span>
        </Label>
        <textarea
          id="keterangan"
          name="keterangan"
          rows={3}
          maxLength={255}
          placeholder="Keterangan tambahan (opsional)"
          defaultValue={defaultValues?.keterangan ?? ""}
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none"
        />
        <p className="text-xs text-slate-400">Maksimal 255 karakter</p>
      </div>
    </div>
  );
};