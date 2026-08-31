"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserCog, Loader2, Check } from "lucide-react";
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
  // Single assignment
  fab?: {
    id_fab: number;
    kode_fab: string;
    nama_pelanggan: string;
    teknisiDitugaskan?: { id_user: number; nama: string } | null;
  };
  // Bulk assignment
  selectedIds?: number[];
  // Data teknisi options (dari server)
  teknisiOptions: TeknisiOption[];
  isTeknisiLoading?: boolean;
}

// Helper component untuk avatar teknisi
function TeknisiAvatar({
  nama,
  foto,
  size = "sm",
  isSelected = false,
}: {
  nama: string;
  foto: string | null;
  size?: "sm" | "lg";
  isSelected?: boolean;
}) {
  const sizeClasses = size === "sm" ? "h-6 w-6 text-[10px]" : "h-10 w-10 text-sm";
  const initials = nama.charAt(0).toUpperCase();

  if (foto) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full flex-shrink-0",
          sizeClasses
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
        "flex items-center justify-center rounded-full flex-shrink-0 font-bold",
        sizeClasses,
        isSelected
          ? "bg-purple-500 text-white"
          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      )}
    >
      {initials}
    </div>
  );
}

export function FabAssignDialog({
  open,
  onOpenChange,
  fab,
  selectedIds = [],
  teknisiOptions,
  isTeknisiLoading = false,
}: FabAssignDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTeknisi, setSelectedTeknisi] = useState<string>("");

  const isBulkMode = selectedIds.length > 0 && !fab;
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
          const result = await bulkAssignFabToTeknisi(selectedIds, teknisiId);
          const msg = result.count > 0
            ? `${result.count} FAB berhasil ditugaskan ke teknisi.`
            : `Tidak ada FAB yang bisa ditugaskan.`;
          toast.success(msg);
          if (result.skippedCount && result.skippedCount > 0) {
            toast.info(`${result.skippedCount} FAB dilewati karena sudah berstatus Aktif.`);
          }
        } else if (fab) {
          await assignFabToTeknisi(fab.id_fab, teknisiId);
          toast.success(
            `FAB ${fab.kode_fab} berhasil ditugaskan ke teknisi.`
          );
        }

        setSelectedTeknisi("");
        onOpenChange(false);
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

  const handleTeknisiChange = (value: string | null) => {
    setSelectedTeknisi(value || "");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-500/20">
                <UserCog className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Current assigned teknisi info (for single mode) */}
            {fab?.teknisiDitugaskan && !isBulkMode && (
              <div className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                <p className="text-amber-700 dark:text-amber-400 font-medium">
                  Teknisi saat ini:
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  {fab.teknisiDitugaskan.nama}
                </p>
                <p className="text-amber-600 dark:text-amber-500 text-xs mt-1">
                  Memilih teknisi lain akan menggantinya.
                </p>
              </div>
            )}

            {/* Teknisi select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pilih Teknisi <span className="text-red-500">*</span>
              </label>
              <Select value={selectedTeknisi} onValueChange={handleTeknisiChange}>
                <SelectTrigger
                  className={cn(
                    "h-12 rounded-xl border-slate-200 dark:border-slate-700",
                    "focus:ring-purple-500 focus:border-purple-400"
                  )}
                >
                  {isTeknisiLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      <span className="text-slate-400">Memuat teknisi...</span>
                    </div>
                  ) : selectedTeknisiData ? (
                    <div className="flex items-center gap-2">
                      <TeknisiAvatar
                        nama={selectedTeknisiData.nama}
                        foto={selectedTeknisiData.foto}
                        size="sm"
                        isSelected={false}
                      />
                      <span className="font-medium">{selectedTeknisiData.nama}</span>
                      <span className="text-slate-400 text-xs">
                        @{selectedTeknisiData.username}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-- Pilih Teknisi --</span>
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl border-slate-200 dark:border-slate-700 p-1.5 z-[100]">
                  {teknisiOptions.length === 0 && !isTeknisiLoading ? (
                    <div className="px-3 py-4 text-center text-sm text-slate-400">
                      Tidak ada teknisi tersedia
                    </div>
                  ) : (
                    teknisiOptions.map((teknisi) => (
                      <SelectItem
                        key={teknisi.id_user}
                        value={String(teknisi.id_user)}
                        className={cn(
                          "rounded-xl gap-2 py-2.5 cursor-pointer",
                          "focus:bg-purple-50 dark:focus:bg-purple-500/10",
                          currentTeknisiId === teknisi.id_user &&
                            "bg-purple-50 dark:bg-purple-500/20"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <TeknisiAvatar
                            nama={teknisi.nama}
                            foto={teknisi.foto}
                            size="sm"
                            isSelected={currentTeknisiId === teknisi.id_user}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{teknisi.nama}</span>
                            <span className="text-xs text-slate-400">
                              @{teknisi.username}
                            </span>
                          </div>
                          {currentTeknisiId === teknisi.id_user && (
                            <Check className="ml-auto h-4 w-4 text-purple-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-xl h-10"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !selectedTeknisi || isTeknisiLoading}
              className="rounded-xl h-10 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menugaskan...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 h-4 w-4" />
                  {isBulkMode ? "Tugaskan Semua" : "Tugaskan"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}