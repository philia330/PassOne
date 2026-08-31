"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOnt, updateOnt } from "../actions";
import { validateSerialInput, validateTextInput } from "@/lib/validations/hooks";

type Pop = { id_pop: number; nama_pop: string };
type Odp = { id_odp: number; nama_odp: string };

type OntData = {
  id_ont: number;
  serial_number: string;
  pelanggan: string;
  model: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_pop: number | null;
  id_odp: number | null;
};

const statusLabel: Record<string, string> = {
  TERSEDIA: "Tersedia",
  TERPASANG: "Terpasang",
  RUSAK: "Rusak",
};

export const OntFormDialog = ({
  mode,
  pops,
  odps,
  data,
  defaultOdpId,
  onOntCreated,
  externalOpen,
  onExternalOpenChange,
}: {
  mode: "create" | "edit";
  pops: Pop[];
  odps: Odp[];
  data?: OntData;
  defaultOdpId?: number | null;
  onOntCreated?: (ont: { id_ont: number; serial_number: string; model: string | null }) => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (onExternalOpenChange ?? (() => {}) ) : setInternalOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const initialStatus = data?.status === "TERPASANG" ? "TERSEDIA" : (data?.status ?? "TERSEDIA");
  const [statusValue, setStatusValue] = useState<"TERSEDIA" | "RUSAK">(initialStatus);
  const [popValue, setPopValue] = useState(
    data?.id_pop ? String(data.id_pop) : (defaultOdpId ? "" : "")
  );
  const [odpValue, setOdpValue] = useState(
    data?.id_odp ? String(data.id_odp) : (defaultOdpId ? String(defaultOdpId) : "")
  );
  const [serialNumber, setSerialNumber] = useState(data?.serial_number ?? "");
  const [model, setModel] = useState(data?.model ?? "");

  const isOdpLocked = !!defaultOdpId;
  const selectedOdpName = odps.find((o) => String(o.id_odp) === odpValue)?.nama_odp ?? "-";

  const getPopName = () => {
    if (isOdpLocked) {
      return "(otomatis dari ODP)";
    }
    return pops.find((p) => String(p.id_pop) === popValue)?.nama_pop ?? "-";
  };

  const getOdpName = () => {
    if (isOdpLocked) {
      return selectedOdpName;
    }
    return odps.find((o) => String(o.id_odp) === odpValue)?.nama_odp ?? "-";
  };

  const getStatusLabel = () => {
    return statusLabel[mode === "create" ? "TERSEDIA" : statusValue] ?? "-";
  };

  useEffect(() => {
    if (open) {
      setShowConfirmDialog(false);
      setPendingFormData(null);
      setIsSubmitting(false);

      if (mode === "edit" && data) {
        setSerialNumber(data.serial_number ?? "");
        setModel(data.model ?? "");
        setPopValue(data.id_pop ? String(data.id_pop) : "");
        setOdpValue(data.id_odp ? String(data.id_odp) : "");
        setStatusValue(data.status === "TERPASANG" ? "TERSEDIA" : (data.status ?? "TERSEDIA"));
      } else {
        setSerialNumber("");
        setModel("");
        setPopValue("");
        // Fix: jangan selalu di-reset ke "" -- kalau dialog ini dibuka dari
        // BAA dengan ODP yang sudah dikunci (defaultOdpId), field ODP harus
        // langsung terisi dari situ. Sebelumnya ini selalu "" sehingga
        // validasi "ODP wajib dipilih" gagal terus meski field-nya terlihat
        // sudah keisi (karena isOdpLocked hanya mengunci tampilan, bukan state).
        setOdpValue(defaultOdpId ? String(defaultOdpId) : "");
        setStatusValue("TERSEDIA");
      }
    }
  }, [open, mode, data, defaultOdpId]);

  const handlePopChange = (value: string | null) => {
    setPopValue(value || "");
  };

  const handleOdpChange = (value: string | null) => {
    setOdpValue(value || "");
  };

  const handleSerialNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateSerialInput(e.target.value, 50);
      setSerialNumber(sanitized);
    },
    []
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateTextInput(e.target.value, 100);
      setModel(sanitized);
    },
    []
  );

  const handleSubmit = (formData: FormData) => {
    if (!odpValue) {
      toast.error("ODP wajib dipilih.");
      return;
    }

    if (!isOdpLocked && !popValue) {
      toast.error("POP wajib dipilih.");
      return;
    }

    if (!serialNumber || serialNumber.trim().length < 5) {
      toast.error("Serial number minimal 5 karakter.");
      return;
    }

    if (serialNumber.length > 50) {
      toast.error("Serial number maksimal 50 karakter.");
      return;
    }

    setPendingFormData(formData);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createOnt(pendingFormData);
        toast.success("ONT berhasil ditambahkan");

        if (onOntCreated) {
          onOntCreated({
            id_ont: 0,
            serial_number: serialNumber,
            model: model || null,
          });
        }
      } else if (data) {
        await updateOnt(data.id_ont, pendingFormData);
        toast.success("ONT berhasil diperbarui");
      }

      setShowConfirmDialog(false);
      setPendingFormData(null);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

  const isFormValid = odpValue && serialNumber.trim().length >= 5;

  const dialogDescription = isOdpLocked
    ? "ONT akan terdaftar di ODP yang sudah dipilih di form. Nama pelanggan akan terisi otomatis saat ONT dipakai di BAA."
    : "Lengkapi data ONT di bawah ini. Nama pelanggan akan terisi otomatis saat ONT ini dipakai di BAA.";

  const confirmationTitle = mode === "create" ? "Konfirmasi Tambah ONT" : "Konfirmasi Perubahan ONT";
  const confirmationDesc = mode === "create"
    ? "Pastikan data yang Anda masukkan sudah benar. ONT akan segera ditambahkan ke sistem."
    : "Periksa kembali perubahan yang akan dilakukan. Data akan langsung diperbarui.";

  const createTriggerButton = (
    <Button className="h-12 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-md hover:opacity-90 active:scale-95 hover:scale-105 transition-transform font-semibold">
      <Plus className="mr-2 h-4 w-4" />
      Tambah ONT
    </Button>
  );

  const editTriggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer rounded-xl active:scale-90 transition-transform dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 active:scale-90 transition-all dark:text-orange-400 dark:hover:text-orange-300" />
    </Button>
  );

  const popOptions = pops.map((pop) => ({
    value: String(pop.id_pop),
    label: pop.nama_pop,
  }));

  const odpOptions = odps.map((odp) => ({
    value: String(odp.id_odp),
    label: odp.nama_odp,
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {!isOdpLocked && mode === "create" && (
          <DialogTrigger asChild>{createTriggerButton}</DialogTrigger>
        )}

        {!isOdpLocked && mode === "edit" && (
          <DialogTrigger asChild>{editTriggerButton}</DialogTrigger>
        )}

        <DialogContent className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {mode === "create" ? "Tambah ONT" : "Edit ONT"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  POP<span className="text-red-500 ml-1">*</span>
                </label>

                {isOdpLocked ? (
                  <>
                    <input type="hidden" name="id_pop" value={popValue} />
                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{getPopName()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <SearchableSelect
                      value={popValue}
                      onValueChange={handlePopChange}
                      options={popOptions}
                      placeholder="Pilih POP"
                      searchPlaceholder="Cari nama POP..."
                      emptyText="POP tidak ditemukan"
                    />
                    <input type="hidden" name="id_pop" value={popValue} required />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  ODP<span className="text-red-500 ml-1">*</span>
                </label>

                {isOdpLocked ? (
                  <>
                    <input type="hidden" name="id_odp" value={odpValue} />
                    <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{selectedOdpName}</span>
                    </div>
                    <p className="text-xs text-slate-400">Mengikuti ODP yang dipilih di form BAA</p>
                  </>
                ) : (
                  <>
                    <SearchableSelect
                      value={odpValue}
                      onValueChange={handleOdpChange}
                      options={odpOptions}
                      placeholder="Pilih ODP"
                      searchPlaceholder="Cari nama ODP..."
                      emptyText="ODP tidak ditemukan"
                    />
                    <input type="hidden" name="id_odp" value={odpValue} required />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>

              {mode === "create" ? (
                <div className="flex items-center gap-3">
                  <input type="hidden" name="status" value="TERSEDIA" />
                  <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">Tersedia</span>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">Status otomatis diatur saat ONT ditambahkan</span>
                </div>
              ) : (
                <Select value={statusValue} onValueChange={(v) => setStatusValue(v as typeof statusValue)}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 hover:scale-105 active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
                    <SelectValue placeholder="Pilih status">
                      {(value: string) => statusLabel[value] ?? "Pilih status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <SelectItem value="TERSEDIA" className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100">Tersedia</SelectItem>
                    <SelectItem value="RUSAK" className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100">Rusak</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {mode === "edit" && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Catatan: status <span className="font-semibold text-emerald-600 dark:text-emerald-400">Terpasang</span> diatur otomatis saat ONT dipakai di BAA.
                </p>
              )}

              <input type="hidden" name="status" value={mode === "create" ? "TERSEDIA" : statusValue} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Serial Number<span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                name="serial_number"
                value={serialNumber}
                onChange={handleSerialNumberChange}
                placeholder="Contoh: SN-HW-00123456"
                maxLength={50}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                {serialNumber.length}/50 karakter. Hanya huruf, angka, dan tanda hubung (-).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Model<span className="text-slate-400 font-normal ml-1">(opsional)</span>
              </label>
              <Input
                name="model"
                value={model}
                onChange={handleModelChange}
                placeholder="Contoh: Huawei HG8245H"
                maxLength={100}
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">{model.length}/100 karakter</p>
            </div>

            {mode === "edit" && data?.pelanggan && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pelanggan Saat Ini</label>
                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{data.pelanggan}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Diisi otomatis dari BAA yang memakai ONT ini.</p>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-2xl h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95 hover:scale-105 transition-transform"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="cursor-pointer rounded-2xl h-11 font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-md hover:opacity-90 active:scale-95 hover:scale-105 transition-transform"
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showConfirmDialog && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{confirmationTitle}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{confirmationDesc}</p>

            <div className="space-y-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Serial Number:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{serialNumber}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Model:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{model || "-"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{getStatusLabel()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">POP:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{getPopName()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">ODP:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{getOdpName()}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelConfirm} className="rounded-xl">
                Kembali & Periksa
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white hover:opacity-90 rounded-xl"
              >
                {isSubmitting ? "Menyimpan..." : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Ya, Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};