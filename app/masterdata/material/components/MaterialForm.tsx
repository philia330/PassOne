"use client";

import { useState, useCallback } from "react";
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
import {
  validateTextInput,
  validateNumericInput,
  validateMaxLength,
} from "@/lib/validations/hooks";

interface MaterialFormProps {
  defaultValues?: MaterialData;
  kodeOtomatis?: string;
}

export const MaterialForm = ({ defaultValues, kodeOtomatis }: MaterialFormProps) => {
  const [kondisi, setKondisi] = useState<"BAIK" | "RUSAK">(defaultValues?.kondisi ?? "BAIK");
  const [namaMaterial, setNamaMaterial] = useState(defaultValues?.nama_material ?? "");
  const [satuan, setSatuan] = useState(defaultValues?.satuan ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle nama material change with validation
  const handleNamaMaterialChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateTextInput(e.target.value, 100);
      setNamaMaterial(sanitized);
      // Clear error on change
      if (errors.nama_material) {
        setErrors((prev) => ({ ...prev, nama_material: "" }));
      }
    },
    [errors.nama_material]
  );

  // Handle satuan change with validation
  const handleSatuanChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateTextInput(e.target.value, 20);
      setSatuan(sanitized);
      if (errors.satuan) {
        setErrors((prev) => ({ ...prev, satuan: "" }));
      }
    },
    [errors.satuan]
  );

  // Handle numeric inputs
  const handleNumericChange = useCallback(
    (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateNumericInput(e.target.value, 6);
      e.target.value = sanitized;
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

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
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nama_material"
          name="nama_material"
          placeholder="Masukkan nama material"
          value={namaMaterial}
          onChange={handleNamaMaterialChange}
          maxLength={100}
          autoComplete="off"
          className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 ${
            errors.nama_material ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          required
        />
        {errors.nama_material ? (
          <p className="text-xs text-red-500">{errors.nama_material}</p>
        ) : (
          <p className="text-xs text-slate-400">{namaMaterial.length}/100 karakter</p>
        )}
      </div>

      {/* Stok */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="stok"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Boxes size={13} className="text-purple-500" /> Stok
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="stok"
          name="stok"
          type="number"
          min={0}
          max={999999}
          placeholder="0"
          defaultValue={defaultValues?.stok ?? 0}
          onChange={(e) => handleNumericChange("stok", e)}
          className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 ${
            errors.stok ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          required
        />
        {errors.stok && <p className="text-xs text-red-500">{errors.stok}</p>}
      </div>

      {/* Minimal Stok */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="minimal_stok"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <AlertTriangle size={13} className="text-purple-500" /> Minimal Stok
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="minimal_stok"
          name="minimal_stok"
          type="number"
          min={0}
          max={999999}
          placeholder="5"
          defaultValue={defaultValues?.minimal_stok ?? 5}
          onChange={(e) => handleNumericChange("minimal_stok", e)}
          className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 ${
            errors.minimal_stok ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          required
        />
        {errors.minimal_stok && <p className="text-xs text-red-500">{errors.minimal_stok}</p>}
      </div>

      {/* Satuan */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="satuan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Ruler size={13} className="text-purple-500" /> Satuan
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="satuan"
          name="satuan"
          placeholder="Meter, PCS, Unit"
          value={satuan}
          onChange={handleSatuanChange}
          maxLength={20}
          autoComplete="off"
          className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 ${
            errors.satuan ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          required
        />
        {errors.satuan ? (
          <p className="text-xs text-red-500">{errors.satuan}</p>
        ) : (
          <p className="text-xs text-slate-400">{satuan.length}/20 karakter</p>
        )}
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
            placeholder="Masukkan harga"
            defaultValue={defaultValues?.harga}
            onChange={(e) => handleNumericChange("harga", e)}
            className={`rounded-2xl h-12 pl-10 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 ${
              errors.harga ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            required
          />
        </div>
        {errors.harga && <p className="text-xs text-red-500">{errors.harga}</p>}
      </div>

      {/* Kondisi - full width di mobile, 1 kolom di desktop */}
      <div className="col-span-1 space-y-2 sm:col-span-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <AlertTriangle size={13} className="text-purple-500" /> Kondisi
          <span className="text-red-500">*</span>
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
          <span className="text-slate-400 font-normal">(opsional)</span>
        </Label>
        <textarea
          id="keterangan"
          name="keterangan"
          rows={3}
          maxLength={500}
          placeholder="Tulis keterangan tambahan di sini (opsional)"
          defaultValue={defaultValues?.keterangan ?? ""}
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none"
        />
        <p className="text-xs text-slate-400">Maksimal 500 karakter</p>
      </div>
    </div>
  );
};