"use client";

import { useRef, useState, useMemo } from "react";
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
  Camera,
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
  CurrentUser,
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
  currentUser: CurrentUser;
}

interface TeknisiRow {
  rowId: string;
  id_user: string;
}

// Status BAA sekarang selalu "SELESAI" -- tidak ada lagi Pending/Proses.
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

  // ================================================================
  // TANGGAL INSTALASI -- terkunci otomatis. Mode create: hari ini.
  // Mode edit: tetap pakai tanggal yang sudah tersimpan (tidak ditimpa
  // jadi hari ini), sama-sama tidak bisa diubah manual dari form.
  // ================================================================
  const tanggalValue = defaultValues?.tanggal_instalasi
    ? toDateInputValue(defaultValues.tanggal_instalasi)
    : toDateInputValue(new Date());

  const tanggalDisplay = tanggalValue
    ? new Date(tanggalValue).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // ================================================================
  // FOTO INSTALASI -- dropzone custom, ganti input file bawaan browser
  // ================================================================
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    defaultValues?.foto_instalasi ?? null
  );
  const [fotoFileName, setFotoFileName] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPreview(URL.createObjectURL(file));
      setFotoFileName(file.name);
    } else {
      setFotoPreview(defaultValues?.foto_instalasi ?? null);
      setFotoFileName(null);
    }
  }

  // Input file yang sama dipakai untuk dua mode -- atribut "capture" di-set
  // atau dilepas sesaat sebelum di-trigger. Di Android/iOS ini langsung
  // membuka kamera (capture) atau galeri (tanpa capture). Di Windows/desktop,
  // browser mengabaikan "capture" sepenuhnya, jadi dua-duanya sama-sama
  // membuka File Explorer biasa -- tidak ada yang error.
  function openCamera() {
    fotoInputRef.current?.setAttribute("capture", "environment");
    fotoInputRef.current?.click();
  }

  function openGallery() {
    fotoInputRef.current?.removeAttribute("capture");
    fotoInputRef.current?.click();
  }

  const [idOlt, setIdOlt] = useState(defaultValues?.id_olt ? String(defaultValues.id_olt) : "");
  const [idOdp, setIdOdp] = useState(defaultValues?.id_odp ? String(defaultValues.id_odp) : "");
  const [idOnt, setIdOnt] = useState(defaultValues?.id_ont ? String(defaultValues.id_ont) : "");

  // ================================================================
  // TEKNISI UTAMA -- SELALU dikunci ke user yang login (sama pola
  // dengan "penginput" di FAB).
  // ================================================================
  const mainTeknisiId = String(currentUser.id_user);

  // ================================================================
  // TEKNISI TAMBAHAN
  // ================================================================
  const [extraTeknisiRows, setExtraTeknisiRows] = useState<TeknisiRow[]>(
    () =>
      defaultValues?.teknisiTambahan
        ?.filter((t) => String(t.id_user) !== mainTeknisiId)
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

  const getAvailableTeknisiOptions = (currentRowId: string) => {
    const selectedInOtherRows = extraTeknisiRows
      .filter((r) => r.rowId !== currentRowId && r.id_user)
      .map((r) => r.id_user);

    return teknisiOptions.filter(
      (t) => String(t.id_user) !== mainTeknisiId && !selectedInOtherRows.includes(String(t.id_user))
    );
  };

  const extraTeknisiIds = extraTeknisiRows.filter((r) => r.id_user).map((r) => r.id_user);

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

  const handleOltChange = (value: string | null) => {
    if (value !== null) setIdOlt(value);
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

  // Sama seperti mergedFabOptions -- jaga-jaga kalau data ODP/ONT yang
  // sedang dipakai (mode edit) sudah tidak ada lagi di daftar opsi baru.
  const mergedOdpOptions = useMemo(() => {
    if (defaultValues?.odp && !odpOptions.some((o) => o.id_odp === defaultValues.odp!.id_odp)) {
      return [
        { id_odp: defaultValues.odp.id_odp, nama_odp: defaultValues.odp.nama_odp } as OdpOption,
        ...odpOptions,
      ];
    }
    return odpOptions;
  }, [odpOptions, defaultValues]);

  const mergedOntOptions = useMemo(() => {
    if (defaultValues?.ont && !ontOptions.some((o) => o.id_ont === defaultValues.ont!.id_ont)) {
      return [
        {
          id_ont: defaultValues.ont.id_ont,
          serial_number: defaultValues.ont.serial_number,
          pelanggan: (defaultValues.ont as { pelanggan?: string }).pelanggan ?? null,
        } as OntOption,
        ...ontOptions,
      ];
    }
    return ontOptions;
  }, [ontOptions, defaultValues]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
      {/* Kode BAA */}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Tag size={13} className="text-purple-500" /> Kode BAA
        </Label>
        <div className="relative">
          <Input
            value={defaultValues?.kode_baa ?? kodeOtomatis ?? ""}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-mono font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Dibuat otomatis, tidak bisa diubah manual</p>
      </div>

      {/* Tanggal Instalasi -- terkunci otomatis ke hari ini (mode create) */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Calendar size={13} className="text-purple-500" /> Tanggal Instalasi
        </Label>
        <div className="relative">
          <Input
            value={tanggalDisplay}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Otomatis tercatat sesuai tanggal BAA ini diinput.
        </p>
        <input type="hidden" name="tanggal_instalasi" value={tanggalValue} />
      </div>

      {/* Status -- selalu terkunci "Selesai" */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Activity size={13} className="text-purple-500" /> Status
        </Label>
        <div className="relative">
          <Input
            value="Selesai"
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          BAA otomatis selesai saat disimpan — FAB terkait ikut jadi Aktif.
        </p>
        <input type="hidden" name="status" value={status} />
      </div>

      {/* FAB */}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
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

      {/* TEKNISI UTAMA -- dikunci ke user yang login */}
      <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 pt-3 dark:text-slate-400">
          <User size={13} className="text-purple-500" /> Teknisi Utama (Anda)
        </Label>
        <div className="relative">
          <Input
            value={currentUser.nama}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Tercatat otomatis sebagai teknisi yang menginput BAA ini.</p>
        <input type="hidden" name="id_user" value={mainTeknisiId} required />
      </div>

      {/* TEKNISI TAMBAHAN */}
      <div className="col-span-1 md:col-span-2 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <UserCog size={13} className="text-purple-500" /> Teknisi Tambahan
          </Label>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addTeknisiRow}
            className="rounded-xl h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-500/10"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Teknisi
          </Button>
        </div>

        {extraTeknisiRows.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-3 text-center dark:text-slate-500 dark:bg-slate-800/50">
            Belum ada teknisi tambahan. Klik &quot;Tambah Teknisi&quot; kalau ada rekan yang ikut
            mengerjakan instalasi ini.
          </p>
        ) : (
          <div className="space-y-2">
            {extraTeknisiRows.map((row) => (
              <div
                key={row.rowId}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50"
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
                    <SelectTrigger className="rounded-xl h-10 border-slate-200 bg-white text-sm w-full dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 dark:hover:bg-red-500/10"
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
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Router size={13} className="text-purple-500" /> OLT
        </Label>
        <Select
          value={idOlt}
          onValueChange={handleOltChange}
          items={oltOptions.map((o) => ({ value: String(o.id_olt), label: o.nama_olt }))}
        >
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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

      {/* ODP -- sekarang searchable, sama pola dengan FAB */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <GitBranch size={13} className="text-purple-500" /> ODP
        </Label>
        <SearchableSelect
          value={idOdp}
          onValueChange={setIdOdp}
          options={mergedOdpOptions.map((o) => ({
            value: String(o.id_odp),
            label: o.nama_odp,
          }))}
          placeholder="Pilih ODP"
          searchPlaceholder="Cari nama ODP..."
          emptyText="ODP tidak ditemukan"
        />
        <input type="hidden" name="id_odp" value={idOdp} required />
      </div>

      {/* ONT -- sekarang searchable, sama pola dengan FAB */}
      <div className="col-span-1 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Wifi size={13} className="text-purple-500" /> ONT
        </Label>
        <SearchableSelect
          value={idOnt}
          onValueChange={setIdOnt}
          options={mergedOntOptions.map((o) => ({
            value: String(o.id_ont),
            label: (o as { pelanggan?: string | null }).pelanggan
              ? `${o.serial_number} — ${(o as { pelanggan?: string | null }).pelanggan}`
              : o.serial_number,
          }))}
          placeholder="Pilih ONT"
          searchPlaceholder="Cari serial number / nama pelanggan..."
          emptyText="ONT tidak ditemukan"
        />
        <input type="hidden" name="id_ont" value={idOnt} required />
      </div>

      {/* Port OLT */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="port_olt"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Hash size={13} className="text-purple-500" /> Port OLT
        </Label>
        <Input
          id="port_olt"
          name="port_olt"
          type="number"
          placeholder="Contoh: 3"
          min={1}
          max={9999}
          defaultValue={defaultValues?.port_olt ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          required
        />
      </div>

      {/* Port ODP */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="port_odp"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Hash size={13} className="text-purple-500" /> Port ODP
        </Label>
        <Input
          id="port_odp"
          name="port_odp"
          type="number"
          placeholder="Contoh: 5"
          min={1}
          max={9999}
          defaultValue={defaultValues?.port_odp ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          required
        />
      </div>

      {/* RX Power */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="rx_power_dbm"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Gauge size={13} className="text-purple-500" /> RX Power (dBm)
        </Label>
        <Input
          id="rx_power_dbm"
          name="rx_power_dbm"
          type="number"
          step="any"
          placeholder="Contoh: -18.5 (biasanya minus)"
          required
          defaultValue={defaultValues?.rx_power_dbm ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* TX Power */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="tx_power_dbm"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Gauge size={13} className="text-purple-500" /> TX Power (dBm)
        </Label>
        <Input
          id="tx_power_dbm"
          name="tx_power_dbm"
          type="number"
          step="any"
          placeholder="Contoh: 3.2"
          required
          defaultValue={defaultValues?.tx_power_dbm ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Speed Download */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="speed_download"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Download size={13} className="text-purple-500" /> Speed Download
        </Label>
        <Input
          id="speed_download"
          name="speed_download"
          placeholder="Contoh: 50 Mbps"
          required
          defaultValue={defaultValues?.speed_download ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Speed Upload */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="speed_upload"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Upload size={13} className="text-purple-500" /> Speed Upload
        </Label>
        <Input
          id="speed_upload"
          name="speed_upload"
          placeholder="Contoh: 20 Mbps"
          required
          defaultValue={defaultValues?.speed_upload ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Ping */}
      <div className="col-span-1 space-y-2">
        <Label
          htmlFor="ping_ms"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <Timer size={13} className="text-purple-500" /> Ping (ms)
        </Label>
        <Input
          id="ping_ms"
          name="ping_ms"
          type="number"
          step="any"
          placeholder="Contoh: 12"
          required
          defaultValue={defaultValues?.ping_ms ?? ""}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* ================================================ */}
      {/* FOTO INSTALASI -- dropzone custom, ganti input file bawaan */}
      {/* ================================================ */}
      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <ImageIcon size={13} className="text-purple-500" /> Foto Instalasi
        </Label>

        {/* Input asli disembunyikan -- semua interaksi lewat dropzone custom */}
        <input
          ref={fotoInputRef}
          id="foto_instalasi"
          name="foto_instalasi"
          type="file"
          accept="image/*"
          onChange={handleFotoChange}
          className="sr-only"
        />

        <button
          type="button"
          onClick={openGallery}
          className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-purple-300 hover:bg-purple-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-purple-700 dark:hover:bg-purple-500/10"
        >
          {fotoPreview ? (
            <div className="relative">
              <img
                src={fotoPreview}
                alt="Preview foto instalasi"
                className="h-40 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Ganti Foto
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-500/20">
                <ImageIcon size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Klik untuk pilih foto instalasi
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                JPG, PNG — maks. 5MB
              </p>
            </div>
          )}
        </button>

        {/* Ambil Foto (kamera) & Pilih dari Galeri -- input yang sama, cuma
            atribut capture-nya beda sebelum di-trigger. Di desktop dua-duanya
            sama-sama buka File Explorer, tidak masalah. */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openCamera}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:text-purple-400"
          >
            <Camera size={14} /> Ambil Foto
          </button>
          <button
            type="button"
            onClick={openGallery}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:text-purple-400"
          >
            <ImageIcon size={14} /> Pilih dari Galeri
          </button>
        </div>

        {fotoFileName ? (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            File dipilih: <span className="font-medium">{fotoFileName}</span>
          </p>
        ) : fotoPreview && fotoPreview === defaultValues?.foto_instalasi ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Foto saat ini. Klik dropzone kalau mau menggantinya.
          </p>
        ) : null}

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
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <StickyNote size={13} className="text-purple-500" /> Catatan Teknisi
        </Label>
        <textarea
          id="catatan"
          name="catatan"
          rows={2}
          placeholder="Catatan tambahan (opsional)"
          defaultValue={defaultValues?.catatan ?? ""}
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* DAFTAR MATERIAL */}
      <div className="col-span-1 md:col-span-2 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 gap-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Boxes size={13} className="text-purple-500" /> Material yang Dipakai
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addRow}
            className="rounded-xl h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-500/10"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Material
          </Button>
        </div>

        {materialRows.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-3 text-center dark:text-slate-500 dark:bg-slate-800/50">
            Belum ada material ditambahkan. Klik &quot;Tambah Material&quot; kalau ada material
            yang dipakai pada instalasi ini.
          </p>
        ) : (
          <div className="space-y-2">
            {materialRows.map((row) => (
              <div
                key={row.rowId}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-2xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50"
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
                    <SelectTrigger className="rounded-xl h-10 border-slate-200 bg-white text-sm w-full dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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
                    className="rounded-xl h-10 border-slate-200 bg-white text-sm text-center dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex-1 w-full sm:w-auto space-y-1.5">
                  <Input
                    placeholder="Keterangan (opsional)"
                    value={row.keterangan}
                    onChange={(e) => updateRow(row.rowId, "keterangan", e.target.value)}
                    className="rounded-xl h-10 border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row.rowId)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 dark:hover:bg-red-500/10"
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