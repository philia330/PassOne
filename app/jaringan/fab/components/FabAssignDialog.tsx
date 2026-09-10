"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UserCog,
  Loader2,
  Check,
  ChevronDown,
  Sparkles,
  Search,
} from "lucide-react";

import {
  assignFabToTeknisi,
  bulkAssignFabToTeknisi,
} from "../actions";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

interface TeknisiOption {
  id_user: number;
  nama: string;
  username: string;
  foto: string | null;
}

interface FabAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * Callback ketika warning bulk dilanjutkan.
   * FAB yang berstatus AKTIF akan dikeluarkan dari daftar.
   */
  onBulkWarningContinue?: (filteredSelectedIds: number[]) => void;

  /**
   * Callback setelah proses bulk assignment berhasil.
   */
  onBulkAssignSuccess?: () => void;

  /**
   * Data untuk single assignment.
   */
  fab?: {
    id_fab: number;
    kode_fab: string;
    nama_pelanggan: string;

    /**
     * Teknisi yang sedang ditugaskan ke FAB.
     * Jika ada, akan muncul warning sebelum mengganti teknisi.
     */
    teknisiDitugaskan?: {
      id_user: number;
      nama: string;
    } | null;
  };

  /**
   * ID FAB yang dipilih untuk bulk assignment.
   */
  selectedIds?: number[];

  /**
   * Data FAB untuk kebutuhan pengecekan status.
   */
  selectedFabData?: Array<{
    id_fab: number;
    kode_fab?: string;
    nama_pelanggan?: string;
    status: "OPEN" | "AKTIF";
    id_penginput?: number | null;
  }>;

  /**
   * Daftar teknisi dari server.
   */
  teknisiOptions: TeknisiOption[];

  /**
   * Status loading teknisi.
   */
  isTeknisiLoading?: boolean;
}

/**
 * Helper untuk menampilkan avatar teknisi.
 *
 * Jika foto tersedia, tampilkan foto.
 * Jika tidak ada foto, tampilkan inisial nama.
 */
function TeknisiAvatar({
  nama,
  foto,
  size = "sm",
  isSelected = false,
}: {
  nama: string;
  foto: string | null;
  size?: "sm" | "lg" | "xl";
  isSelected?: boolean;
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[11px]",
    lg: "h-10 w-10 text-sm",
    xl: "h-14 w-14 text-lg",
  }[size];

  const initials = nama.charAt(0).toUpperCase();

  /**
   * Jika teknisi memiliki foto.
   */
  if (foto) {
    return (
      <div
        className={cn(
          "relative flex-shrink-0 overflow-hidden rounded-full",
          "ring-2 ring-offset-2 transition-all duration-300",
          sizeClasses,
          isSelected
            ? "scale-105 ring-purple-500"
            : "ring-transparent hover:ring-purple-300",
        )}
      >
        <Image
          src={foto}
          alt={nama}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  /**
   * Jika teknisi tidak memiliki foto.
   */
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full",
        "font-bold ring-2 ring-offset-2 transition-all duration-300",
        sizeClasses,
        isSelected
          ? "scale-105 bg-gradient-to-br from-violet-500 to-purple-600 text-white ring-purple-500 shadow-lg shadow-purple-500/30"
          : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 ring-transparent hover:ring-purple-300 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300",
      )}
    >
      {initials}
    </div>
  );
}

export function FabAssignDialog({
  open,
  onOpenChange,
  onBulkWarningContinue,
  onBulkAssignSuccess,
  fab,
  selectedIds = [],
  selectedFabData = [],
  teknisiOptions,
  isTeknisiLoading = false,
}: FabAssignDialogProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  /**
   * ID teknisi yang dipilih.
   */
  const [selectedTeknisi, setSelectedTeknisi] = useState("");

  /**
   * Warning untuk bulk assignment ketika ada FAB AKTIF.
   */
  const [showActiveWarning, setShowActiveWarning] = useState(false);

  /**
   * Warning untuk single assignment ketika FAB
   * sudah mempunyai teknisi.
   */
  const [showAlreadyAssignedWarning, setShowAlreadyAssignedWarning] =
    useState(false);

  /**
   * Keyword pencarian teknisi.
   */
  const [teknisiSearch, setTeknisiSearch] = useState("");

  /**
   * Menentukan mode bulk.
   *
   * Jika ada selectedIds dan tidak ada fab,
   * berarti sedang melakukan bulk assignment.
   */
  const isBulkMode = selectedIds.length > 0 && !fab;

  /**
   * Ambil FAB yang berstatus AKTIF.
   */
  const activeSelectedFab = selectedFabData.filter(
    (item) => item.status === "AKTIF",
  );

  /**
   * Filter teknisi berdasarkan nama atau username.
   */
  const filteredTeknisiOptions = teknisiOptions.filter((teknisi) => {
    const query = teknisiSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      teknisi.nama.toLowerCase().includes(query) ||
      teknisi.username.toLowerCase().includes(query)
    );
  });

  /**
   * Tampilkan warning bulk jika terdapat FAB AKTIF.
   */
  useEffect(() => {
    if (
      open &&
      isBulkMode &&
      activeSelectedFab.length > 0
    ) {
      setShowActiveWarning(true);
    }
  }, [
    open,
    isBulkMode,
    activeSelectedFab.length,
  ]);

  /**
   * Tampilkan warning single jika FAB sudah memiliki teknisi.
   *
   * Warning ini muncul ketika dialog dibuka.
   */
  useEffect(() => {
    if (!open || isBulkMode) {
      setShowAlreadyAssignedWarning(false);
      return;
    }

    setShowAlreadyAssignedWarning(Boolean(fab?.teknisiDitugaskan));
  }, [open, isBulkMode]);

  /**
   * Reset state ketika dialog ditutup.
   */
  useEffect(() => {
    if (!open) {
      setShowActiveWarning(false);
      setShowAlreadyAssignedWarning(false);
      setTeknisiSearch("");
      setSelectedTeknisi("");
    }
  }, [open]);

  /**
   * Judul dialog berdasarkan mode.
   */
  const title = isBulkMode
    ? `Tugaskan ${selectedIds.length} FAB ke Teknisi`
    : "Tugaskan FAB ke Teknisi";

  /**
   * Deskripsi dialog berdasarkan mode.
   */
  const description = isBulkMode
    ? `Pilih teknisi yang akan ditugaskan untuk ${selectedIds.length} FAB yang dipilih.`
    : `Pilih teknisi yang akan mengerjakan FAB ${fab?.kode_fab} - ${fab?.nama_pelanggan}.`;

  /**
   * ID teknisi yang sedang mengerjakan FAB.
   */
  const currentTeknisiId =
    fab?.teknisiDitugaskan?.id_user;

  /**
   * Data teknisi yang sedang dipilih.
   */
  const selectedTeknisiData = teknisiOptions.find(
    (teknisi) =>
      String(teknisi.id_user) === selectedTeknisi,
  );

  /**
   * Submit assignment.
   */
  const handleSubmit = () => {
    if (!selectedTeknisi) {
      toast.error("Pilih teknisi yang akan ditugaskan.");
      return;
    }

    const teknisiId = Number.parseInt(
      selectedTeknisi,
      10,
    );

    if (Number.isNaN(teknisiId)) {
      toast.error("Teknisi yang dipilih tidak valid.");
      return;
    }

    startTransition(async () => {
      try {
        /**
         * BULK ASSIGNMENT
         */
        if (isBulkMode) {
          const activeSelected = selectedFabData.filter(
            (item) => item.status === "AKTIF",
          );

          if (activeSelected.length > 0) {
            toast.warning(
              `${activeSelected.length} FAB dipilih sudah berstatus Aktif dan akan dilewati.`,
              {
                duration: 4000,
              },
            );
          }

          const result = await bulkAssignFabToTeknisi(
            selectedIds,
            teknisiId,
          );

          const message =
            result.count > 0
              ? `${result.count} FAB berhasil ditugaskan ke teknisi.`
              : "Tidak ada FAB yang bisa ditugaskan.";

          toast.success(message);

          if (
            result.skippedCount &&
            result.skippedCount > 0
          ) {
            toast.info(
              `${result.skippedCount} FAB dilewati karena sudah berstatus Aktif.`,
              {
                duration: 4000,
              },
            );
          }

          if (
            result.unauthorizedCount &&
            result.unauthorizedCount > 0
          ) {
            toast.warning(
              `${result.unauthorizedCount} FAB bukan milik Anda dan dilewati.`,
              {
                duration: 4000,
              },
            );
          }
        }

        /**
         * SINGLE ASSIGNMENT
         */
        else if (fab) {
          await assignFabToTeknisi(
            fab.id_fab,
            teknisiId,
          );

          toast.success(
            `FAB ${fab.kode_fab} berhasil ditugaskan ke teknisi.`,
          );
        }

        /**
         * Reset state setelah berhasil.
         */
        setSelectedTeknisi("");
        setTeknisiSearch("");
        setShowAlreadyAssignedWarning(false);
        setShowActiveWarning(false);

        onOpenChange(false);

        onBulkAssignSuccess?.();

        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan.",
        );
      }
    });
  };

  /**
   * Menutup dialog dan mereset state.
   */
  const handleClose = () => {
    setSelectedTeknisi("");
    setTeknisiSearch("");
    setShowActiveWarning(false);
    setShowAlreadyAssignedWarning(false);

    onOpenChange(false);
  };

  /**
   * Melanjutkan warning bulk.
   *
   * FAB yang berstatus AKTIF tidak ikut ditugaskan.
   */
  const handleContinueWarning = () => {
    if (!isBulkMode) {
      setShowActiveWarning(false);
      return;
    }

    const filteredIds = selectedIds.filter(
      (id) =>
        !selectedFabData.some(
          (fabItem) =>
            fabItem.id_fab === id &&
            fabItem.status === "AKTIF",
        ),
    );

    setSelectedTeknisi("");
    setShowActiveWarning(false);

    onBulkWarningContinue?.(filteredIds);
  };

  /**
   * Handler ketika teknisi dipilih.
   */
  const handleTeknisiChange = (value: string) => {
    setSelectedTeknisi(value);
    setTeknisiSearch("");
  };

  return (
    <>
      {/* =====================================================
          WARNING MODAL - BULK
          FAB berstatus AKTIF
      ====================================================== */}

      {isBulkMode &&
        showActiveWarning &&
        activeSelectedFab.length > 0 && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-amber-200/50 bg-white p-6 shadow-2xl dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                    <span className="text-2xl">⚠️</span>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                      Peringatan
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      FAB Aktif Terdeteksi
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowActiveWarning(false)
                  }
                  className="rounded-full p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Tutup peringatan"
                >
                  <span className="text-xl leading-none">
                    ×
                  </span>
                </button>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                FAB berikut sudah berstatus{" "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Aktif
                </span>{" "}
                dan tidak bisa ditugaskan. Anda bisa
                melanjutkan untuk memilih data lain yang
                ingin ditugaskan.
              </p>

              <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-amber-200/50 bg-gradient-to-b from-amber-50/50 to-orange-50/30 p-3 dark:border-amber-500/20 dark:from-amber-500/5 dark:to-orange-500/5">
                {activeSelectedFab.map(
                  (fabItem, index) => (
                    <div
                      key={fabItem.id_fab}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm shadow-sm dark:bg-slate-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                          {index + 1}
                        </div>

                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {fabItem.kode_fab ??
                            `FAB-${fabItem.id_fab}`}
                        </span>
                      </div>

                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        Aktif
                      </span>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  onClick={handleContinueWarning}
                  className="h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-semibold text-white shadow-lg shadow-amber-500/30 transition-all duration-200 hover:scale-105 hover:brightness-110 hover:shadow-xl"
                >
                  Lanjutkan
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          WARNING MODAL - SINGLE
          FAB sudah mempunyai teknisi
      ====================================================== */}

      {!isBulkMode &&
        showAlreadyAssignedWarning &&
        fab?.teknisiDitugaskan && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-amber-200/50 bg-white p-6 shadow-2xl dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                    <UserCog className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                      Peringatan
                    </p>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      FAB Sudah Ditugaskan
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Tutup peringatan"
                >
                  <span className="text-xl leading-none">
                    ×
                  </span>
                </button>
              </div>

              <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                FAB{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {fab.kode_fab} - {fab.nama_pelanggan}
                </span>{" "}
                sudah ditugaskan ke teknisi{" "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {fab.teknisiDitugaskan.nama}
                </span>
                .
                <br />
                <br />
                Apakah kamu ingin mengganti teknisi yang
                ditugaskan pada FAB ini?
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-11 rounded-2xl border-2 border-slate-200/80 px-5 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setShowAlreadyAssignedWarning(false);
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-semibold text-white shadow-lg shadow-amber-500/30 transition-all duration-200 hover:scale-105 hover:brightness-110 hover:shadow-xl"
                >
                  Lanjutkan, Ganti Teknisi
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          MAIN DIALOG
      ====================================================== */}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            handleClose();
          }
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border-0 p-0 sm:max-w-md",

            // Background
            "bg-gradient-to-br from-white via-white to-violet-50/50",
            "dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/30",

            // Shadow
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(120,100,255,0.1)]",
            "dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(120,100,255,0.2)]",

            // Animation
            "data-[state=open]:animate-in",
            "data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0",
            "data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95",
            "data-[state=closed]:zoom-out-95",
            "data-[state=open]:slide-in-from-bottom-[50%]",
            "data-[state=closed]:slide-out-to-bottom-[50%]",
            "data-[state=open]:duration-300",
            "data-[state=closed]:duration-250",
          )}
        >
          {/* =================================================
              HEADER
          ================================================== */}

          <div className="relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-400/20 blur-2xl" />

            <div
              className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-2xl"
              style={{
                animationDelay: "3s",
              }}
            />

            <div className="relative border-b border-slate-100/80 bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-transparent px-6 py-5 dark:border-slate-700/50 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-transparent">
              <DialogHeader className="space-y-4">
                <DialogTitle className="flex items-center gap-4 text-left text-xl font-bold text-slate-800 dark:text-slate-100">
                  <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30">
                    <UserCog className="h-6 w-6 text-white" />

                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yellow-300" />
                  </div>

                  <div className="min-w-0">
                    <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text dark:from-white dark:to-slate-200">
                      {title}
                    </span>
                  </div>
                </DialogTitle>

                <DialogDescription className="text-left text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {description}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================== */}

          <div className="flex-1 space-y-4 overflow-y-auto p-6 pb-4">
            {/* Teknisi yang sedang ditugaskan */}

            {fab?.teknisiDitugaskan &&
              !isBulkMode && (
                <div className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                      <span className="text-lg">👤</span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Teknisi Saat Ini
                      </p>

                      <p className="mt-0.5 font-bold text-amber-800 dark:text-amber-300">
                        {fab.teknisiDitugaskan.nama}
                      </p>

                      <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-500/80">
                        Memilih teknisi lain akan
                        menggantinya.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* =================================================
                TEKNISI SELECT
            ================================================== */}

            <div className="space-y-3 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-800/40">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  *
                </span>

                Pilih Teknisi
              </label>

              <Select
                value={selectedTeknisi}
                onValueChange={handleTeknisiChange}
                onOpenChange={(isSelectOpen) => {
                  if (!isSelectOpen) {
                    setTeknisiSearch("");
                  }
                }}
              >
                {/* =================================================
                    SELECT TRIGGER
                    Ikon bawaan disembunyikan agar tidak muncul
                    dua segitiga.
                ================================================== */}

                <SelectTrigger
                  className={cn(
                    "group h-14 rounded-2xl border-2 border-slate-200/80 bg-white px-4",
                    "transition-all duration-200",
                    "hover:border-violet-300 hover:shadow-md",
                    "focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20",
                    "dark:border-slate-700/80 dark:bg-slate-900",
                    "data-[placeholder]:text-slate-400",

                    // Menyembunyikan ikon bawaan Select.
                    "[&>svg]:hidden",
                  )}
                >
                  {isTeknisiLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-violet-500" />

                      <span className="text-slate-400">
                        Memuat teknisi...
                      </span>
                    </div>
                  ) : selectedTeknisiData ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <TeknisiAvatar
                        nama={selectedTeknisiData.nama}
                        foto={selectedTeknisiData.foto}
                        size="sm"
                      />

                      <div className="flex min-w-0 flex-1 flex-col text-left">
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                          {selectedTeknisiData.nama}
                        </span>

                        <span className="truncate text-xs text-slate-400">
                          @{selectedTeknisiData.username}
                        </span>
                      </div>

                      {/* Hanya ikon ini yang ditampilkan */}
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center gap-2 text-slate-400">
                      <UserCog className="h-5 w-5" />

                      <span className="flex-1 text-left">
                        -- Pilih Teknisi --
                      </span>

                      {/* Hanya ikon ini yang ditampilkan */}
                      <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  )}
                </SelectTrigger>

                {/* =================================================
                    SELECT CONTENT
                ================================================== */}

                <SelectContent
                  position="popper"
                  sideOffset={6}
                  className={cn(
                    "w-[var(--radix-select-trigger-width)] min-w-[280px]",
                    "overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-white p-0",
                    "shadow-xl shadow-slate-900/10",
                    "dark:border-slate-700/80 dark:bg-slate-900",
                  )}
                >
                  {/* =================================================
                      SEARCH BAR
                  ================================================== */}

                  <div
                    className="sticky top-0 z-20 border-b border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        value={teknisiSearch}
                        onChange={(event) =>
                          setTeknisiSearch(
                            event.target.value,
                          )
                        }
                        onKeyDown={(event) => {
                          /**
                           * Mencegah keyboard Radix Select
                           * mengambil alih input search.
                           */
                          event.stopPropagation();
                        }}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                        placeholder="Cari nama atau username..."
                        autoFocus
                        className={cn(
                          "h-10 w-full rounded-xl",
                          "border border-slate-200",
                          "bg-slate-50",
                          "pl-9 pr-9",
                          "text-sm text-slate-700",
                          "placeholder:text-slate-400",
                          "outline-none",
                          "transition-all duration-200",
                          "focus:border-violet-400",
                          "focus:bg-white",
                          "focus:ring-2 focus:ring-violet-400/20",
                          "dark:border-slate-700",
                          "dark:bg-slate-800",
                          "dark:text-slate-100",
                          "dark:focus:bg-slate-800",
                        )}
                      />

                      {/* Tombol hapus pencarian */}

                      {teknisiSearch && (
                        <button
                          type="button"
                          onClick={() =>
                            setTeknisiSearch("")
                          }
                          onPointerDown={(event) =>
                            event.stopPropagation()
                          }
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          aria-label="Hapus pencarian"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Informasi hasil pencarian */}

                    {!isTeknisiLoading &&
                      teknisiOptions.length > 0 &&
                      teknisiSearch && (
                        <div className="mt-2 px-1 text-[11px] text-slate-400">
                          {filteredTeknisiOptions.length}{" "}
                          teknisi ditemukan
                        </div>
                      )}
                  </div>

                  {/* =================================================
                      LIST TEKNISI
                  ================================================== */}

                  <div
                    className={cn(
                      "max-h-[300px] overflow-y-auto p-2",

                      // Scrollbar light mode
                      "[&::-webkit-scrollbar]:w-2",
                      "[&::-webkit-scrollbar-track]:rounded-full",
                      "[&::-webkit-scrollbar-track]:bg-slate-100",
                      "[&::-webkit-scrollbar-thumb]:rounded-full",
                      "[&::-webkit-scrollbar-thumb]:bg-slate-300",
                      "[&::-webkit-scrollbar-thumb:hover]:bg-slate-400",

                      // Scrollbar dark mode
                      "dark:[&::-webkit-scrollbar-track]:bg-slate-800",
                      "dark:[&::-webkit-scrollbar-thumb]:bg-slate-600",
                      "dark:[&::-webkit-scrollbar-thumb:hover]:bg-slate-500",
                    )}
                  >
                    {/* Loading */}

                    {isTeknisiLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-500" />

                        <span>
                          Memuat teknisi...
                        </span>
                      </div>
                    ) : teknisiOptions.length === 0 ? (
                      /* Tidak ada teknisi */
                      <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <UserCog className="h-7 w-7 opacity-50" />
                        </div>

                        <span>
                          Tidak ada teknisi tersedia
                        </span>
                      </div>
                    ) : filteredTeknisiOptions.length ===
                      0 ? (
                      /* Search tidak menemukan */
                      <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <Search className="h-6 w-6 opacity-50" />
                        </div>

                        <span className="text-center">
                          Teknisi &quot;{teknisiSearch}&quot;
                          <br />
                          tidak ditemukan
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setTeknisiSearch("")
                          }
                          className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/10"
                        >
                          Hapus pencarian
                        </button>
                      </div>
                    ) : (
                      /* Daftar teknisi */
                      filteredTeknisiOptions.map(
                        (teknisi) => {
                          const isSelected =
                            selectedTeknisi ===
                            String(teknisi.id_user);

                          const isCurrent =
                            currentTeknisiId ===
                            teknisi.id_user;

                          return (
                            <SelectItem
                              key={teknisi.id_user}
                              value={String(
                                teknisi.id_user,
                              )}
                              className={cn(
                                "mb-1 cursor-pointer rounded-xl",
                                "px-3 py-3",
                                "transition-colors duration-150",
                                "focus:bg-violet-50",
                                "dark:focus:bg-violet-500/15",
                                isSelected &&
                                  "bg-violet-50 dark:bg-violet-500/15",
                              )}
                            >
                              <div className="flex w-full items-center gap-3">
                                <TeknisiAvatar
                                  nama={teknisi.nama}
                                  foto={teknisi.foto}
                                  size="lg"
                                  isSelected={
                                    isSelected ||
                                    isCurrent
                                  }
                                />

                                <div className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                                    {teknisi.nama}
                                  </span>

                                  <span className="truncate text-xs text-slate-400">
                                    @{teknisi.username}
                                  </span>
                                </div>

                                {isCurrent && (
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                                    Saat ini
                                  </span>
                                )}

                                {isSelected && (
                                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/20">
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          );
                        },
                      )
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="border-t border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-violet-50/30 px-6 py-5 dark:border-slate-700/50 dark:from-slate-900/80 dark:to-violet-950/20">
            <div className="flex items-center justify-between gap-4">
              {/* BATAL */}

              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className={cn(
                  "h-11 rounded-2xl border-2 border-slate-200/80",
                  "bg-white/80 px-5 font-semibold text-slate-600",
                  "transition-all duration-300",
                  "hover:border-slate-300 hover:bg-white hover:shadow-lg",
                  "dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
                  "dark:hover:border-slate-600 dark:hover:bg-slate-800",
                )}
              >
                Batal
              </Button>

              {/* TUGASKAN */}

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  !selectedTeknisi ||
                  isTeknisiLoading
                }
                className={cn(
                  "h-11 rounded-2xl",
                  "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500",
                  "px-6 font-bold text-white",
                  "shadow-xl shadow-purple-500/30",
                  "transition-all duration-300",
                  "hover:scale-105 hover:brightness-110 hover:shadow-2xl hover:shadow-purple-500/40",
                  "active:scale-95",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "disabled:hover:scale-100 disabled:hover:shadow-xl",
                )}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Menugaskan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />

                    {isBulkMode
                      ? "Tugaskan Semua"
                      : "Tugaskan"}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}