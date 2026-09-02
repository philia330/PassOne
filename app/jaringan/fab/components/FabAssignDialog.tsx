"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserCog, Loader2, Check, ChevronDown, Sparkles } from "lucide-react";
import { assignFabToTeknisi, bulkAssignFabToTeknisi } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  onBulkWarningContinue?: (filteredSelectedIds: number[]) => void;
  onBulkAssignSuccess?: () => void;
  // Single assignment
  fab?: {
    id_fab: number;
    kode_fab: string;
    nama_pelanggan: string;
    teknisiDitugaskan?: { id_user: number; nama: string } | null;
  };
  // Bulk assignment
  selectedIds?: number[];
  selectedFabData?: Array<{
    id_fab: number;
    kode_fab?: string;
    nama_pelanggan?: string;
    status: "OPEN" | "AKTIF";
    id_penginput?: number | null;
  }>;
  // Data teknisi options (dari server)
  teknisiOptions: TeknisiOption[];
  isTeknisiLoading?: boolean;
}

// Helper component untuk avatar teknisi dengan animasi
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

  if (foto) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full flex-shrink-0 ring-2 ring-offset-2 transition-all duration-300",
          sizeClasses,
          isSelected
            ? "ring-purple-500 scale-105"
            : "ring-transparent hover:ring-purple-300"
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

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full flex-shrink-0 font-bold ring-2 ring-offset-2 transition-all duration-300",
        sizeClasses,
        isSelected
          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white ring-purple-500 scale-105 shadow-lg shadow-purple-500/30"
          : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300 ring-transparent hover:ring-purple-300"
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
  const [selectedTeknisi, setSelectedTeknisi] = useState<string>("");
  const [showActiveWarning, setShowActiveWarning] = useState(false);

  const isBulkMode = selectedIds.length > 0 && !fab;
  const activeSelectedFab = selectedFabData.filter((item) => item.status === "AKTIF");

  useEffect(() => {
    if (open && isBulkMode && activeSelectedFab.length > 0) {
      setShowActiveWarning(true);
    }
  }, [open, isBulkMode, activeSelectedFab.length]);
  const title = isBulkMode
    ? `Tugaskan ${selectedIds.length} FAB ke Teknisi`
    : `Tugaskan FAB ke Teknisi`;
  const description = isBulkMode
    ? `Pilih teknisi yang akan ditugaskan untuk ${selectedIds.length} FAB yang dipilih.`
    : `Pilih teknisi yang akan mengerjakan FAB ${fab?.kode_fab} - ${fab?.nama_pelanggan}.`;

  const currentTeknisiId = fab?.teknisiDitugaskan?.id_user;

  // Cari nama teknisi yang sedang dipilih (untuk display di trigger)
  const selectedTeknisiData = teknisiOptions.find(
    (t) => String(t.id_user) === selectedTeknisi
  );

  const handleSubmit = () => {
    if (!selectedTeknisi) {
      toast.error("Pilih teknisi yang akan ditugaskan.");
      return;
    }

    const teknisiId = parseInt(selectedTeknisi, 10);

    startTransition(async () => {
      try {
        if (isBulkMode) {
          const activeSelected = selectedFabData.filter((item) => item.status === "AKTIF");
          if (activeSelected.length > 0) {
            toast.warning(`${activeSelected.length} FAB dipilih sudah berstatus Aktif dan akan dilewati.`, {
              duration: 4000,
            });
          }

          const result = await bulkAssignFabToTeknisi(selectedIds, teknisiId);
          const msg = result.count > 0
            ? `${result.count} FAB berhasil ditugaskan ke teknisi.`
            : `Tidak ada FAB yang bisa ditugaskan.`;
          toast.success(msg);
          if (result.skippedCount && result.skippedCount > 0) {
            toast.info(`${result.skippedCount} FAB dilewati karena sudah berstatus Aktif.`, {
              duration: 4000,
            });
          }
          if (result.unauthorizedCount && result.unauthorizedCount > 0) {
            toast.warning(`${result.unauthorizedCount} FAB bukan milik Anda dan dilewati.`, {
              duration: 4000,
            });
          }
        } else if (fab) {
          await assignFabToTeknisi(fab.id_fab, teknisiId);
          toast.success(
            `FAB ${fab.kode_fab} berhasil ditugaskan ke teknisi.`
          );
        }

        setSelectedTeknisi("");
        onOpenChange(false);
        onBulkAssignSuccess?.();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
      }
    });
  };

  const handleClose = () => {
    setSelectedTeknisi("");
    onOpenChange(false);
  };

  const handleContinueWarning = () => {
    if (!isBulkMode) {
      setShowActiveWarning(false);
      return;
    }

    const filteredIds = selectedIds.filter(
      (id) => !selectedFabData.some((fabItem) => fabItem.id_fab === id && fabItem.status === "AKTIF")
    );

    setSelectedTeknisi("");
    setShowActiveWarning(false);
    onBulkWarningContinue?.(filteredIds);
  };

  const handleTeknisiChange = (value: string | null) => {
    setSelectedTeknisi(value || "");
  };

  return (
    <>
      {/* Animated Warning Modal */}
      {isBulkMode && showActiveWarning && activeSelectedFab.length > 0 && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fab-fadeIn"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-amber-200/50 bg-white p-6 shadow-2xl dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 animate-fab-scaleIn"
          >
            {/* Animated warning icon */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 animate-fab-pulse-amber"
                >
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Peringatan
                  </p>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    FAB Aktif terdeteksi
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveWarning(false)}
                className="rounded-full p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Tutup peringatan"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              FAB berikut sudah berstatus <span className="font-semibold text-amber-600 dark:text-amber-400">Aktif</span> dan tidak bisa ditugaskan. Anda bisa melanjutkan untuk memilih data lain yang ingin ditugaskan.
            </p>

            {/* Animated list */}
            <div
              className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-amber-200/50 bg-gradient-to-b from-amber-50/50 to-orange-50/30 p-3 dark:border-amber-500/20 dark:from-amber-500/5 dark:to-orange-500/5 animate-fab-slideUp stagger-1"
            >
              {activeSelectedFab.map((fab, index) => (
                <div
                  key={fab.id_fab}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-slate-800/60 animate-fab-slideIn"
                  style={{ animationDelay: `${index * 50 + 100}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {fab.kode_fab ?? `FAB-${fab.id_fab}`}
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    Aktif
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end animate-fab-slideUp stagger-2">
              <Button
                type="button"
                onClick={handleContinueWarning}
                className="h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-semibold text-white shadow-lg shadow-amber-500/30 transition-all duration-200 hover:shadow-xl hover:scale-105 hover:brightness-110"
              >
                Lanjutkan
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={cn(
            "sm:max-w-md rounded-3xl max-h-[90vh] flex flex-col border-0 p-0 overflow-hidden",
            // Animated background gradients
            "bg-gradient-to-br from-white via-white to-violet-50/50",
            "dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/30",
            // Enhanced shadow
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(120,100,255,0.1)]",
            "dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(120,100,255,0.2)]",
            // Smooth open animation
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            // Slide in from bottom, slide out back to bottom (smooth)
            "data-[state=open]:slide-in-from-bottom-[50%] data-[state=closed]:slide-out-to-bottom-[50%]",
            "data-[state=open]:duration-300 data-[state=closed]:duration-250",
            // Smoothe easing for close
            "data-[state=closed]:ease-[cubic-bezier(0.4,0,0.2,1)]"
          )}
        >
          {/* Animated header with gradient */}
          <div className="relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-400/20 blur-2xl animate-fab-float"
            />
            <div
              className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-2xl animate-fab-float"
              style={{ animationDelay: "3s" }}
            />

            <div className="relative border-b border-slate-100/80 bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-transparent px-6 py-5 dark:border-slate-700/50 dark:from-violet-500/10 dark:via-purple-500/5 dark:to-transparent">
              <DialogHeader className="space-y-4">
                <DialogTitle className="flex items-center gap-4 text-left text-xl font-bold text-slate-800 dark:text-slate-100">
                  {/* Animated icon */}
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30 animate-fab-bounceIn"
                  >
                    <UserCog className="h-6 w-6 text-white" />
                    {/* Sparkle effect */}
                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-yellow-300 animate-fab-sparkle" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text">
                      {title}
                    </span>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-left text-sm leading-relaxed text-slate-600 dark:text-slate-300 animate-fab-slideUp stagger-1">
                  {description}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Content area */}
          <div className="space-y-4 p-6 pb-4 overflow-y-auto flex-1">
            {/* Current assigned teknisi info (for single mode) */}
            {fab?.teknisiDitugaskan && !isBulkMode && (
              <div
                className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/5 animate-fab-slideUp stagger-2"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Teknisi saat ini
                    </p>
                    <p className="mt-0.5 font-bold text-amber-800 dark:text-amber-300">
                      {fab.teknisiDitugaskan.nama}
                    </p>
                    <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-500/80">
                      Memilih teknisi lain akan menggantinya.
                    </p>
                  </div>
                </div>
                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-200/0 via-amber-200/50 to-amber-200/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            )}

            {/* Teknisi select with enhanced styling */}
            <div
              className="space-y-3 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-800/40 animate-fab-slideUp stagger-3"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  *
                </span>
                Pilih Teknisi
              </label>
              <Select value={selectedTeknisi} onValueChange={handleTeknisiChange}>
                <SelectTrigger
                  className={cn(
                    "group h-14 rounded-2xl border-2 border-slate-200/80 bg-white px-4 transition-all duration-300",
                    "dark:border-slate-700/80 dark:bg-slate-900",
                    "hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10",
                    "focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20",
                    "data-[placeholder]:text-slate-400",
                    // Remove Radix arrow indicator with CSS
                    "[&>svg]:hidden"
                  )}
                >
                  {isTeknisiLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-7 w-7 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                      </div>
                      <span className="text-slate-400">Memuat teknisi...</span>
                      <ChevronDown className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  ) : selectedTeknisiData ? (
                    <div className="flex items-center gap-3 flex-1">
                      <TeknisiAvatar
                        nama={selectedTeknisiData.nama}
                        foto={selectedTeknisiData.foto}
                        size="sm"
                        isSelected={false}
                      />
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedTeknisiData.nama}</span>
                        <span className="text-xs text-slate-400">
                          @{selectedTeknisiData.username}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 flex-1">
                      <UserCog className="h-5 w-5" />
                      <span className="flex-1">-- Pilih Teknisi --</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent
                  className={cn(
                    // Increased height for better visibility
                    "max-h-[420px] overflow-y-auto rounded-2xl border-2 border-slate-200/50 bg-white p-2 shadow-2xl shadow-slate-900/15",
                    "dark:border-slate-700/50 dark:bg-slate-900",
                    // Smooth open/close animations - slide from top with smooth ease
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    // Slide out back to top (same direction as open)
                    "data-[state=open]:slide-in-from-[var(--radix-select-content-transform-origin)] data-[state=closed]:slide-out-to-[var(--radix-select-content-transform-origin)]",
                    "data-[state=closed]:ease-[cubic-bezier(0.4,0,0.2,1)]",
                    "data-[state=open]:duration-250 data-[state=closed]:duration-200",
                    // Custom scrollbar
                    "teknisi-dropdown-scroll [&::-webkit-scrollbar]:w-2",
                    // Glow effect on open
                    "data-[state=open]:shadow-[0_25px_50px_-12px_rgba(124,58,237,0.25),0_0_0_1px_rgba(124,58,237,0.1)]",
                    "dark:data-[state=open]:shadow-[0_25px_50px_-12px_rgba(139,92,246,0.3),0_0_0_1px_rgba(139,92,246,0.2)]"
                  )}
                >
                  {teknisiOptions.length === 0 && !isTeknisiLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-400 animate-fab-slideUp">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <UserCog className="h-7 w-7 opacity-50" />
                      </div>
                      <span>Tidak ada teknisi tersedia</span>
                    </div>
                  ) : (
                    <>
                      {teknisiOptions.map((teknisi, index) => (
                      <SelectItem
                        key={teknisi.id_user}
                        value={String(teknisi.id_user)}
                        className={cn(
                          "rounded-xl gap-3 py-3 px-3 cursor-pointer transition-all duration-200",
                          "hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 hover:shadow-md hover:scale-[1.02]",
                          "dark:hover:bg-gradient-to-r dark:hover:from-violet-500/15 dark:hover:to-purple-500/15 dark:hover:shadow-lg dark:hover:shadow-purple-500/10",
                          "focus:bg-gradient-to-r focus:from-violet-100 focus:to-purple-50",
                          "dark:focus:bg-violet-500/25",
                          currentTeknisiId === teknisi.id_user &&
                            "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/25 dark:to-purple-500/15",
                          "data-[disabled]:opacity-50"
                        )}
                        style={{ animation: `fab-slideIn 0.2s ease-out ${index * 30}ms both` }}
                      >
                        <div className="flex items-center gap-3">
                          <TeknisiAvatar
                            nama={teknisi.nama}
                            foto={teknisi.foto}
                            size="lg"
                            isSelected={currentTeknisiId === teknisi.id_user}
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{teknisi.nama}</span>
                            <span className="text-xs text-slate-400">
                              @{teknisi.username}
                            </span>
                          </div>
                          {currentTeknisiId === teknisi.id_user && (
                            <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer with enhanced buttons */}
          <div className="border-t border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-violet-50/30 px-6 py-5 dark:border-slate-700/50 dark:from-slate-900/80 dark:to-violet-950/20 animate-fab-slideUp stagger-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className={cn(
                  "h-11 rounded-2xl border-2 border-slate-200/80 bg-white/80 px-5 font-semibold text-slate-600",
                  "transition-all duration-300",
                  "hover:border-slate-300 hover:bg-white hover:shadow-lg",
                  "dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
                  "dark:hover:border-slate-600 dark:hover:bg-slate-800"
                )}
              >
                Batal
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !selectedTeknisi || isTeknisiLoading}
                className={cn(
                  "h-11 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 px-6 font-bold text-white shadow-xl shadow-purple-500/30",
                  "transition-all duration-300",
                  "hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105 hover:brightness-110",
                  "active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-xl"
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
                    {isBulkMode ? "Tugaskan Semua" : "Tugaskan"}
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