"use client";

import { useState, useMemo } from "react";
import {
  Tag,
  Calendar,
  Activity,
  ClipboardList,
  UserCog,
  User,
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
  Lock,
  Plus,
  X,
  Boxes,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BaaData,
  StatusBaa,
  FabOption,
  TeknisiOption,
  OltOption,
  OdpOption,
  OntOption,
  MaterialOption,
  MaterialRow,
  CurrentUser, // ⬅️ pastikan type ini ada/diexport di types/baa.ts (atau import dari @/types/fab kalau shared)
} from "@/types/baa";

interface BaaFormProps {
  defaultValues?: BaaData;
  kodeOtomatis?: string;
  fabOptions: FabOption[];
  teknisiOptions: TeknisiOption[];
  oltOptions: OltOption[];
  odpOptions: OdpOption[];
  ontOptions: OntOption[];
  materialOptions: MaterialOption[];
  currentUser: CurrentUser; // ⬅️ baru — dipakai buat lock Teknisi Utama
}

interface TeknisiRow {
  rowId: string;
  id_user: string;
}

// Status BAA sekarang selalu "SELESAI" -- tidak ada lagi Pending/Proses.
// Konstanta, bukan state, karena nilainya tidak pernah berubah dari sisi form.
const status: StatusBaa = "SELESAI";

function toDateInputValue(date?: Date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function makeRowId() {
  return Math.random().toString(36).slice(2, 10);
}

export const BaaForm = ({
  defaultValues,
  kodeOtomatis,
  fabOptions,
  teknisiOptions,
  oltOptions,
  odpOptions,
  ontOptions,
  materialOptions,
  currentUser,
}: BaaFormProps) => {
  const [idFab, setIdFab] = useState(defaultValues?.id_fab ? String(defaultValues.id_fab) : "");
  const [fotoPreview, setFotoPreview] = useState<string | null>(
  defaultValues?.foto_instalasi ?? null
);

function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  setFotoPreview(file ? URL.createObjectURL(file) : (defaultValues?.foto_instalasi ?? null));
}
  const [idOlt, setIdOlt] = useState(defaultValues?.id_olt ? String(defaultValues.id_olt) : "");
  const [idOdp, setIdOdp] = useState(defaultValues?.id_odp ? String(defaultValues.id_odp) : "");
  const [idOnt, setIdOnt] = useState(defaultValues?.id_ont ? String(defaultValues.id_ont) : "");

  // ================================================================
  // TEKNISI UTAMA -- SELALU dikunci ke user yang login (sama pola
  // dengan "penginput" di FAB). Tidak lagi dropdown, tidak lagi
  // dicampur ke dalam list yang sama dengan teknisi tambahan.
  // ================================================================
  const mainTeknisiId = String(currentUser.id_user);

  // ================================================================
  // TEKNISI TAMBAHAN -- tetap dropdown, tetap bisa ditambah/dihapus
  // seperti sebelumnya. Diambil dari data User (role TEKNISI) yang
  // sudah ada, bukan bikin akun baru dari form ini.
  // ================================================================
  const [extraTeknisiRows, setExtraTeknisiRows] = useState<TeknisiRow[]>(
    () =>
      defaultValues?.teknisiTambahan
        ?.filter((t) => String(t.id_user) !== mainTeknisiId) // jaga-jaga jangan dobel sama teknisi utama
        .map((t) => ({
          rowId: makeRowId(),
          id_user: String(t.id_user),
        })) || []
  );

  // ================================================================
  // MATERIAL
  // ================================================================
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>(
    defaultValues?.baadetail?.length
      ? defaultValues.baadetail.map((d) => ({
          rowId: makeRowId(),
          id_material: String(d.id_material),
          jumlah: String(d.jumlah),
          keterangan: d.keterangan ?? "",
        }))
      : []
  );

  // ================================================================
  // FUNGSI TEKNISI TAMBAHAN (baris dinamis)
  // ================================================================
  const addTeknisiRow = () => {
    setExtraTeknisiRows((rows) => [...rows, { rowId: makeRowId(), id_user: "" }]);
  };

  const removeTeknisiRow = (rowId: string) => {
    setExtraTeknisiRows((rows) => rows.filter((r) => r.rowId !== rowId));
  };

  const updateTeknisiRow = (rowId: string, value: string) => {
    setExtraTeknisiRows((rows) =>
      rows.map((r) => (r.rowId === rowId ? { ...r, id_user: value } : r))
    );
  };

  const handleTeknisiRowChange = (rowId: string, value: string | null) => {
    if (value !== null) {
      updateTeknisiRow(rowId, value);
    }
  };

  // Opsi teknisi tambahan: exclude teknisi utama (currentUser) & exclude
  // yang sudah dipilih di baris tambahan lain
  const getAvailableTeknisiOptions = (currentRowId: string) => {
    const selectedInOtherRows = extraTeknisiRows
      .filter((r) => r.rowId !== currentRowId && r.id_user)
      .map((r) => r.id_user);

    return teknisiOptions.filter(
      (t) => String(t.id_user) !== mainTeknisiId && !selectedInOtherRows.includes(String(t.id_user))
    );
  };

  const extraTeknisiIds = extraTeknisiRows.filter((r) => r.id_user).map((r) => r.id_user);

  // ================================================================
  // FUNGSI MATERIAL
  // ================================================================
  const addRow = () => {
    setMaterialRows((rows) => [
      ...rows,
      { rowId: makeRowId(), id_material: "", jumlah: "1", keterangan: "" },
    ]);
  };

  const removeRow = (rowId: string) => {
    setMaterialRows((rows) => rows.filter((r) => r.rowId !== rowId));
  };

  const updateRow = (rowId: string, field: keyof MaterialRow, value: string) => {
    setMaterialRows((rows) =>
      rows.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r))
    );
  };

  // ================================================================
  // FUNGSI HANDLER SELECT
  // ================================================================

  const handleOltChange = (value: string | null) => {
    if (value !== null) {
      setIdOlt(value);
    }
  };

  const handleOdpChange = (value: string | null) => {
    if (value !== null) {
      setIdOdp(value);
    }
  };

  const handleOntChange = (value: string | null) => {
    if (value !== null) {
      setIdOnt(value);
    }
  };

  const handleMaterialChange = (rowId: string, value: string | null) => {
    if (value !== null) {
      updateRow(rowId, "id_material", value);
    }
  };

  const mergedFabOptions = useMemo(() => {
  if (defaultValues?.fab && !fabOptions.some((f) => f.id_fab === defaultValues.fab!.id_fab)) {
    return [
      {
        id_fab: defaultValues.fab.id_fab,
        kode_fab: defaultValues.fab.kode_fab,
        nama_pelanggan: defaultValues.fab.nama_pelanggan,
      } as FabOption,
      ...fabOptions,
    ];
  }
  return fabOptions;
}, [fabOptions, defaultValues]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
      {/* Kode BAA */}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Tag size={13} className="text-purple-500" /> Kode BAA
        </Label>
        <div className="relative">
          <Input
            value={defaultValues?.kode_baa ?? kodeOtomatis ?? ""}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-mono font-semibold text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">Dibuat otomatis, tidak bisa diubah manual</p>
      </div>

      {/* Tanggal Instalasi */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="tanggal_instalasi"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Calendar size={13} className="text-purple-500" /> Tanggal Instalasi
        </Label>
        <Input
          id="tanggal_instalasi"
          name="tanggal_instalasi"
          type="date"
          defaultValue={toDateInputValue(defaultValues?.tanggal_instalasi)}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      {/* Status -- selalu terkunci "Selesai" */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Activity size={13} className="text-purple-500" /> Status
        </Label>
        <div className="relative">
          <Input
            value="Selesai"
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">
          BAA otomatis selesai saat disimpan — FAB terkait ikut jadi Aktif.
        </p>
        <input type="hidden" name="status" value={status} />
      </div>

      {/* FAB */}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <ClipboardList size={13} className="text-purple-500" /> FAB (Pelanggan)
        </Label>
        <SearchableSelect
  value={idFab}
  onValueChange={setIdFab}
  options={mergedFabOptions.map((f) => ({
    value: String(f.id_fab),
    label: `${f.kode_fab} — ${f.nama_pelanggan}`,
  }))}
  placeholder="Pilih FAB"
  searchPlaceholder="Cari nama pelanggan / kode FAB..."
  emptyText="FAB tidak ditemukan"
/>
<input type="hidden" name="id_fab" value={idFab} required />
      </div>

      {/* ============================================================
          TEKNISI UTAMA -- dikunci ke user yang login, tidak dropdown
          ============================================================ */}
      <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 pt-3">
          <User size={13} className="text-purple-500" /> Teknisi Utama (Anda)
        </Label>
        <div className="relative">
          <Input
            value={currentUser.nama}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">Tercatat otomatis sebagai teknisi yang menginput BAA ini.</p>
        <input type="hidden" name="id_user" value={mainTeknisiId} required />
      </div>

      {/* ============================================================
          TEKNISI TAMBAHAN -- tetap dropdown, tetap bisa nambah/hapus
          ============================================================ */}
      <div className="col-span-1 md:col-span-2 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <UserCog size={13} className="text-purple-500" /> Teknisi Tambahan
          </Label>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addTeknisiRow}
            className="rounded-xl h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Teknisi
          </Button>
        </div>

        {extraTeknisiRows.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-3 text-center">
            Belum ada teknisi tambahan. Klik &quot;Tambah Teknisi&quot; kalau ada rekan yang ikut
            mengerjakan instalasi ini.
          </p>
        ) : (
          <div className="space-y-2">
            {extraTeknisiRows.map((row) => (
              <div
                key={row.rowId}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 bg-slate-50/50"
              >
                <div className="flex-1">
                  <Select
                    value={row.id_user}
                    onValueChange={(v) => handleTeknisiRowChange(row.rowId, v)}
                    items={getAvailableTeknisiOptions(row.rowId).map((t) => ({
                      value: String(t.id_user),
                      label: `${t.nama}${t.username ? ` (@${t.username})` : ""}`,
                    }))}
                  >
                    <SelectTrigger className="rounded-xl h-10 border-slate-200 bg-white text-sm w-full">
                      <SelectValue placeholder="Pilih teknisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTeknisiOptions(row.rowId).map((t) => (
                        <SelectItem key={t.id_user} value={String(t.id_user)}>
                          {t.nama} {t.username ? `(@${t.username})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={() => removeTeknisiRow(row.rowId)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="hidden"
          name="teknisi_tambahan"
          value={JSON.stringify(extraTeknisiIds.map(Number))}
        />
      </div>

      {/* OLT */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Router size={13} className="text-purple-500" /> OLT
        </Label>
        <Select
          value={idOlt}
          onValueChange={handleOltChange}
          items={oltOptions.map((o) => ({ value: String(o.id_olt), label: o.nama_olt }))}
        >
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
            <SelectValue placeholder="Pilih OLT" />
          </SelectTrigger>
          <SelectContent>
            {oltOptions.map((o) => (
              <SelectItem key={o.id_olt} value={String(o.id_olt)}>
                {o.nama_olt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="id_olt" value={idOlt} required />
      </div>

      {/* ODP */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <GitBranch size={13} className="text-purple-500" /> ODP
        </Label>
        <Select
          value={idOdp}
          onValueChange={handleOdpChange}
          items={odpOptions.map((o) => ({ value: String(o.id_odp), label: o.nama_odp }))}
        >
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
            <SelectValue placeholder="Pilih ODP" />
          </SelectTrigger>
          <SelectContent>
            {odpOptions.map((o) => (
              <SelectItem key={o.id_odp} value={String(o.id_odp)}>
                {o.nama_odp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="id_odp" value={idOdp} required />
      </div>

      {/* ONT */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Wifi size={13} className="text-purple-500" /> ONT
        </Label>
        <Select
          value={idOnt}
          onValueChange={handleOntChange}
          items={ontOptions.map((o) => ({ value: String(o.id_ont), label: o.serial_number }))}
        >
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
            <SelectValue placeholder="Pilih ONT" />
          </SelectTrigger>
          <SelectContent>
            {ontOptions.map((o) => (
              <SelectItem key={o.id_ont} value={String(o.id_ont)}>
                {o.serial_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="id_ont" value={idOnt} required />
      </div>

      {/* Port OLT */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="port_olt"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Hash size={13} className="text-purple-500" /> Port OLT
        </Label>
          {/* Port OLT */}
          <Input
            id="port_olt"
            name="port_olt"
            type="number"
            placeholder="Masukan port OLT"
            min={1}
            max={9999}
            defaultValue={defaultValues?.port_olt ?? ""}
            className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
            required
          />
      </div>

      {/* Port ODP */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="port_odp"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Hash size={13} className="text-purple-500" /> Port ODP
        </Label>
            {/* Port ODP */}
            <Input
              id="port_odp"
              name="port_odp"
              type="number"
              placeholder="Masukan port ODP"
              min={1}
              max={9999}
              defaultValue={defaultValues?.port_odp ?? ""}
              className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
              required
            />
      </div>

      {/* RX Power */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="rx_power_dbm"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Gauge size={13} className="text-purple-500" /> RX Power (dBm)
        </Label>
        <Input
          id="rx_power_dbm"
          name="rx_power_dbm"
          type="number"
          step="any"
          placeholder="Masukkan RX Power"
          required
          defaultValue={defaultValues?.rx_power_dbm ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
        />
      </div>

      {/* TX Power */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="tx_power_dbm"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Gauge size={13} className="text-purple-500" /> TX Power (dBm)
        </Label>
        <Input
          id="tx_power_dbm"
          name="tx_power_dbm"
          type="number"
          step="any"
          placeholder="Masukkan TX Power"
          required
          defaultValue={defaultValues?.tx_power_dbm ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
        />
      </div>

      {/* Speed Download */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="speed_download"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Download size={13} className="text-purple-500" /> Speed Download
        </Label>
        <Input
          id="speed_download"
          name="speed_download"
          placeholder="Masukkan Speed Download"
          required
          defaultValue={defaultValues?.speed_download ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
        />
      </div>

      {/* Speed Upload */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="speed_upload"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Upload size={13} className="text-purple-500" /> Speed Upload
        </Label>
        <Input
          id="speed_upload"
          name="speed_upload"
          placeholder="Masukkan Speed Upload"
          required
          defaultValue={defaultValues?.speed_upload ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
        />
      </div>

      {/* Ping */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="ping_ms"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Timer size={13} className="text-purple-500" /> Ping (ms)
        </Label>
        <Input
          id="ping_ms"
          name="ping_ms"
          type="number"
          step="any"
          placeholder="Masukkan Ping"
          required
          defaultValue={defaultValues?.ping_ms ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
        />
      </div>

     {/* Foto Instalasi */}
<div className="col-span-1 md:col-span-2 space-y-2">
  <Label
    htmlFor="foto_instalasi"
    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
  >
    <ImageIcon size={13} className="text-purple-500" /> Foto Instalasi
  </Label>

  {fotoPreview && (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 mb-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fotoPreview}
        alt="Preview foto instalasi"
        className="h-14 w-14 rounded-xl object-cover border border-slate-200"
      />
      <p className="text-xs text-slate-500">
        {fotoPreview === defaultValues?.foto_instalasi
          ? "Foto saat ini. Pilih file baru di bawah kalau mau menggantinya."
          : "Preview foto baru yang dipilih."}
      </p>
    </div>
  )}

  <Input
    id="foto_instalasi"
    name="foto_instalasi"
    type="file"
    accept="image/*"
    onChange={handleFotoChange}
    className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 file:mr-3 file:h-full file:rounded-l-2xl file:border-0 file:bg-slate-100 file:px-4 file:text-sm file:font-semibold file:text-slate-600 cursor-pointer"
  />

  <input
    type="hidden"
    name="foto_instalasi_existing"
    value={defaultValues?.foto_instalasi ?? ""}
  />
</div>

      {/* Catatan */}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label
          htmlFor="catatan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <StickyNote size={13} className="text-purple-500" /> Catatan Teknisi
        </Label>
        <textarea
          id="catatan"
          name="catatan"
          rows={2}
          placeholder="Catatan tambahan (opsional)"
          defaultValue={defaultValues?.catatan ?? ""}
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none"
        />
      </div>

      {/* DAFTAR MATERIAL */}
      <div className="col-span-1 md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 gap-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Boxes size={13} className="text-purple-500" /> Material yang Dipakai
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addRow}
            className="rounded-xl h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Material
          </Button>
        </div>

        {materialRows.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-3 text-center">
            Belum ada material ditambahkan. Klik &quot;Tambah Material&quot; kalau ada material
            yang dipakai pada instalasi ini.
          </p>
        ) : (
          <div className="space-y-2">
            {materialRows.map((row) => (
              <div
                key={row.rowId}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-2xl border border-slate-200 p-3 bg-slate-50/50"
              >
                <div className="flex-1 w-full sm:w-auto space-y-1.5">
                  <Select
                    value={row.id_material}
                    onValueChange={(v) => handleMaterialChange(row.rowId, v)}
                    items={materialOptions.map((m) => ({
                      value: String(m.id_material),
                      label: `${m.nama_material} (${m.satuan})`,
                    }))}
                  >
                    <SelectTrigger className="rounded-xl h-10 border-slate-200 bg-white text-sm w-full">
                      <SelectValue placeholder="Pilih material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialOptions.map((m) => (
                        <SelectItem key={m.id_material} value={String(m.id_material)}>
                          {m.nama_material} ({m.satuan})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-20 space-y-1.5">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Jml"
                    value={row.jumlah}
                    onChange={(e) => updateRow(row.rowId, "jumlah", e.target.value)}
                    className="rounded-xl h-10 border-slate-200 bg-white text-sm text-center"
                  />
                </div>

                <div className="flex-1 w-full sm:w-auto space-y-1.5">
                  <Input
                    placeholder="Keterangan (opsional)"
                    value={row.keterangan}
                    onChange={(e) => updateRow(row.rowId, "keterangan", e.target.value)}
                    className="rounded-xl h-10 border-slate-200 bg-white text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row.rowId)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input type="hidden" name="baa_details" value={JSON.stringify(materialRows)} />
      </div>
    </div>
  );
};