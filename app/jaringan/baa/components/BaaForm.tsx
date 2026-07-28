  "use client";

  import { useState } from "react";
  import {
    Tag,
    Calendar,
    Activity,
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
    Lock,
    Plus,
    X,
    Boxes,
    Loader2,
    UserPlus,
  } from "lucide-react";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Button } from "@/components/ui/button";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
  } from "@/components/ui/dialog";
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
    onTeknisiAdded?: () => void;
  }

  const STATUS_LABEL: Record<StatusBaa, string> = {
    PENDING: "Pending",
    PROSES: "Proses",
    SELESAI: "Selesai",
  };

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
    onTeknisiAdded,
  }: BaaFormProps) => {
    const [status, setStatus] = useState<StatusBaa>(defaultValues?.status ?? "PENDING");
    const [idFab, setIdFab] = useState(defaultValues?.id_fab ? String(defaultValues.id_fab) : "");
    const [idUser, setIdUser] = useState(defaultValues?.id_user ? String(defaultValues.id_user) : "");
    const [idOlt, setIdOlt] = useState(defaultValues?.id_olt ? String(defaultValues.id_olt) : "");
    const [idOdp, setIdOdp] = useState(defaultValues?.id_odp ? String(defaultValues.id_odp) : "");
    const [idOnt, setIdOnt] = useState(defaultValues?.id_ont ? String(defaultValues.id_ont) : "");

    // ================================================================
    // STATE UNTUK TEKNISI TAMBAHAN
    // ================================================================
    const [teknisiTambahan, setTeknisiTambahan] = useState<{ id_user: number; nama: string }[]>(
      defaultValues?.teknisiTambahan?.map((t) => ({
        id_user: t.id_user,
        nama: t.user?.nama || `ID ${t.id_user}`,
      })) || []
    );
    const [selectedTambahan, setSelectedTambahan] = useState<string>("");
    const [errorTambahan, setErrorTambahan] = useState<string | null>(null);

    // ================================================================
    // MODAL TAMBAH TEKNISI BARU
    // ================================================================
    const [showAddTeknisi, setShowAddTeknisi] = useState(false);
    const [newTeknisiName, setNewTeknisiName] = useState("");
    const [newTeknisiUsername, setNewTeknisiUsername] = useState("");
    const [newTeknisiEmail, setNewTeknisiEmail] = useState("");
    const [isAddingTeknisi, setIsAddingTeknisi] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ================================================================
    // MATERIAL
    // ================================================================
    const [materialRows, setMaterialRows] = useState<MaterialRow[]>(
      defaultValues?.baaDetails?.length
        ? defaultValues.baaDetails.map((d) => ({
            rowId: makeRowId(),
            id_material: String(d.id_material),
            jumlah: String(d.jumlah),
            keterangan: d.keterangan ?? "",
          }))
        : []
    );

    // ================================================================
    // FUNGSI TEKNISI TAMBAHAN
    // ================================================================
    const addTeknisiTambahan = () => {
      if (!selectedTambahan) return;
      const id = Number(selectedTambahan);
      const teknisi = teknisiOptions.find((t) => t.id_user === id);
      if (!teknisi) return;

      // Cek apakah sudah ada
      if (teknisiTambahan.some((t) => t.id_user === id)) {
        setErrorTambahan("Teknisi ini sudah ditambahkan");
        return;
      }

      // Cek apakah ini teknisi utama
      if (id === Number(idUser)) {
        setErrorTambahan("Teknisi ini adalah teknisi utama");
        return;
      }

      setTeknisiTambahan([...teknisiTambahan, { id_user: id, nama: teknisi.nama }]);
      setSelectedTambahan("");
      setErrorTambahan(null);
    };

    const removeTeknisiTambahan = (id_user: number) => {
      setTeknisiTambahan(teknisiTambahan.filter((t) => t.id_user !== id_user));
    };

    // ================================================================
    // FUNGSI TAMBAH TEKNISI BARU (Server Action)
    // ================================================================
    const handleAddTeknisi = async (formData: FormData) => {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsAddingTeknisi(true);

      try {
        const { createTeknisi } = await import("@/app/jaringan/baa/actions");
        const result = await createTeknisi(formData);

        if (result.success) {
          setSuccessMsg(`✅ Teknisi "${result.data.nama}" berhasil ditambahkan!`);
          setNewTeknisiName("");
          setNewTeknisiUsername("");
          setNewTeknisiEmail("");

          if (onTeknisiAdded) {
            onTeknisiAdded();
          }

          setTimeout(() => {
            setShowAddTeknisi(false);
            setSuccessMsg(null);
          }, 1500);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message ?? "Terjadi kesalahan");
      } finally {
        setIsAddingTeknisi(false);
      }
    };

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

        {/* Status */}
        <div className="col-span-1 space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Activity size={13} className="text-purple-500" /> Status
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusBaa)}>
            <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as StatusBaa[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="status" value={status} />
        </div>

        {/* FAB */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <ClipboardList size={13} className="text-purple-500" /> FAB (Pelanggan)
          </Label>
          <Select value={idFab} onValueChange={setIdFab}>
            <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
              <SelectValue placeholder="Pilih FAB" />
            </SelectTrigger>
            <SelectContent>
              {fabOptions.map((f) => (
                <SelectItem key={f.id_fab} value={String(f.id_fab)}>
                  {f.kode_fab} — {f.nama_pelanggan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="id_fab" value={idFab} required />
        </div>

        {/* ============================================================
            TEKNISI UTAMA
            ============================================================ */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <UserCog size={13} className="text-purple-500" /> Teknisi Utama
            </Label>

            <Dialog open={showAddTeknisi} onOpenChange={(open) => {
              setShowAddTeknisi(open);
              if (!open) {
                setErrorMsg(null);
                setSuccessMsg(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs border-purple-200 text-purple-700 hover:bg-purple-50 h-8"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Teknisi
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Tambah Teknisi Baru</DialogTitle>
                </DialogHeader>
                <form action={handleAddTeknisi}>
                  <div className="space-y-4 py-4">
                    {successMsg ? (
                      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-700">
                        <span>{successMsg}</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="nama_teknisi" className="text-xs font-bold uppercase">
                            Nama Teknisi <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nama_teknisi"
                            name="nama_teknisi"
                            placeholder="Masukkan nama teknisi"
                            value={newTeknisiName}
                            onChange={(e) => setNewTeknisiName(e.target.value)}
                            className="rounded-2xl h-11 mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="username_teknisi" className="text-xs font-bold uppercase">
                            Username <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="username_teknisi"
                            name="username_teknisi"
                            placeholder="Masukkan username"
                            value={newTeknisiUsername}
                            onChange={(e) => setNewTeknisiUsername(e.target.value.toLowerCase())}
                            className="rounded-2xl h-11 mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email_teknisi" className="text-xs font-bold uppercase">
                            Email (Opsional)
                          </Label>
                          <Input
                            id="email_teknisi"
                            name="email_teknisi"
                            placeholder="email@passnet.id"
                            value={newTeknisiEmail}
                            onChange={(e) => setNewTeknisiEmail(e.target.value)}
                            className="rounded-2xl h-11 mt-1"
                          />
                        </div>
                        {errorMsg && (
                          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                            {errorMsg}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddTeknisi(false)}
                      className="rounded-2xl h-11"
                      disabled={isAddingTeknisi}
                    >
                      {successMsg ? "Tutup" : "Batal"}
                    </Button>
                    {!successMsg && (
                      <Button
                        type="submit"
                        disabled={!newTeknisiName || !newTeknisiUsername || isAddingTeknisi}
                        className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white"
                      >
                        {isAddingTeknisi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAddingTeknisi ? "Menyimpan..." : "Simpan Teknisi"}
                      </Button>
                    )}
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Select value={idUser} onValueChange={setIdUser}>
            <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
              <SelectValue placeholder="Pilih teknisi utama" />
            </SelectTrigger>
            <SelectContent>
              {teknisiOptions.map((t) => (
                <SelectItem key={t.id_user} value={String(t.id_user)}>
                  {t.nama} {t.username ? `(@${t.username})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="id_user" value={idUser} required />
          <p className="text-xs text-slate-400">
            Teknisi utama adalah penanggung jawab instalasi ini
          </p>
        </div>

        {/* ============================================================
            TEKNISI TAMBAHAN
            ============================================================ */}
        <div className="col-span-1 md:col-span-2 space-y-2 border-t border-slate-100 pt-3">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <UserPlus size={13} className="text-purple-500" /> Teknisi Tambahan
          </Label>
          <p className="text-xs text-slate-400">
            Tambahkan teknisi lain yang ikut mengerjakan instalasi ini (opsional)
          </p>

          <div className="flex gap-2">
            <Select value={selectedTambahan} onValueChange={setSelectedTambahan}>
              <SelectTrigger className="rounded-2xl h-11 border-slate-200 focus:ring-purple-500 flex-1">
                <SelectValue placeholder="Pilih teknisi tambahan" />
              </SelectTrigger>
              <SelectContent>
                {teknisiOptions
                  .filter((t) => {
                    const isUtama = Number(idUser) === t.id_user;
                    const isAdded = teknisiTambahan.some((tt) => tt.id_user === t.id_user);
                    return !isUtama && !isAdded;
                  })
                  .map((t) => (
                    <SelectItem key={t.id_user} value={String(t.id_user)}>
                      {t.nama} {t.username ? `(@${t.username})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addTeknisiTambahan}
              disabled={!selectedTambahan}
              className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white px-4"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {errorTambahan && (
            <p className="text-xs text-red-500">{errorTambahan}</p>
          )}

          {/* List teknisi tambahan yang sudah dipilih */}
          {teknisiTambahan.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {teknisiTambahan.map((t) => (
                <div
                  key={t.id_user}
                  className="flex items-center justify-between rounded-xl bg-purple-50 border border-purple-100 px-3 py-2"
                >
                  <span className="text-sm font-medium text-purple-700">{t.nama}</span>
                  <button
                    type="button"
                    onClick={() => removeTeknisiTambahan(t.id_user)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden input untuk kirim teknisi tambahan ke server */}
          <input
            type="hidden"
            name="teknisi_tambahan"
            value={JSON.stringify(teknisiTambahan.map((t) => t.id_user))}
          />
        </div>

        {/* OLT */}
        <div className="col-span-1 space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Router size={13} className="text-purple-500" /> OLT
          </Label>
          <Select value={idOlt} onValueChange={setIdOlt}>
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
          <Select value={idOdp} onValueChange={setIdOdp}>
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
          <Select value={idOnt} onValueChange={setIdOnt}>
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
          <Input
            id="port_olt"
            name="port_olt"
            type="number"
            placeholder="Opsional"
            defaultValue={defaultValues?.port_olt ?? ""}
            className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
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
          <Input
            id="port_odp"
            name="port_odp"
            type="number"
            placeholder="Opsional"
            defaultValue={defaultValues?.port_odp ?? ""}
            className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
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
            placeholder="Opsional, mis. -21.5"
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
            placeholder="Opsional"
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
            placeholder="Opsional, mis. 95 Mbps"
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
            placeholder="Opsional, mis. 45 Mbps"
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
            placeholder="Opsional"
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

          {defaultValues?.foto_instalasi && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaultValues.foto_instalasi}
                alt="Foto instalasi saat ini"
                className="h-14 w-14 rounded-xl object-cover border border-slate-200"
              />
              <p className="text-xs text-slate-500">
                Foto saat ini. Pilih file baru di bawah kalau mau menggantinya.
              </p>
            </div>
          )}

          <Input
            id="foto_instalasi"
            name="foto_instalasi"
            type="file"
            accept="image/*"
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
                      onValueChange={(v) => updateRow(row.rowId, "id_material", v)}
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