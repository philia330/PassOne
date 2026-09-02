"use client";

import { useState } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  MessageCircle,
  UserCog,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FabViewDialog } from "./FabViewDialog";
import { FabDeleteDialog } from "./FabDeleteDialog";
import { FabDialog } from "./FabDialog";
import { FabAssignDialog } from "./FabAssignDialog";
import type { FabData, AreaOption, PaketOption, UserOption, CurrentUser } from "@/types/fab";

type FabActionsDropdownProps = {
  fab: FabData;
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
  currentUser: CurrentUser;
  canEdit: boolean;
  canDelete: boolean;
  // Untuk assign dialog
  teknisiOptions?: Array<{ id_user: number; nama: string; username: string; foto: string | null }>;
};

export function FabActionsDropdown({
  fab,
  areaOptions,
  paketOptions,
  salesOptions,
  currentUser,
  canEdit,
  canDelete,
  teknisiOptions = [],
}: FabActionsDropdownProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // Role yang boleh assign FAB ke teknisi
  const canAssign =
    currentUser.role === "ADMIN" ||
    currentUser.role === "LEADER" ||
    currentUser.role === "SALES";

  const isSalesOwner =
    currentUser.role !== "SALES" ||
    Number(fab.id_penginput ?? fab.penginput?.id_user ?? 0) === Number(currentUser.id_user);

  const canAssignFab =
    canAssign &&
    (currentUser.role !== "SALES" || isSalesOwner) &&
    fab.status !== "AKTIF";

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://www.google.com/maps?q=${fab.latitude},${fab.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let cleanNumber = fab.no_hp.replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.substring(1);
    }
    const url = `https://wa.me/${cleanNumber}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteOpen(true);
  };

  const handleAssign = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAssignOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        {/* DropdownMenuTrigger di sini dibangun dari Base UI (MenuPrimitive.Trigger),
            BUKAN Radix -- dia tidak punya prop "asChild". Pakai "asChild" + <Button>
            di dalamnya bikin dua elemen <button> ke-render bertumpuk (nested button,
            invalid HTML + hydration error) dan prop "asChild" ikut nyantung ke DOM.
            Solusinya: pakai prop "render" dengan elemen <button> polos yang di-style
            pakai buttonVariants, jangan bungkus <Button> di dalam trigger. */}
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 cursor-pointer rounded-xl active:scale-90 transition-transform")}
            />
          }
        >
          <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/30"
        >
          {/* View - FabViewDialog langsung di dalam dropdown */}
          <FabViewDialog fab={fab} />

          {/* Google Maps */}
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={openGoogleMaps}
            className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-sky-50 dark:focus:bg-sky-500/10"
          >
            <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Buka di Google Maps</span>
          </DropdownMenuItem>

          {/* WhatsApp */}
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={openWhatsApp}
            className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-green-50 dark:focus:bg-green-500/10"
          >
            <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Hubungi via WhatsApp</span>
          </DropdownMenuItem>

          {/* Assign ke Teknisi - hanya untuk ADMIN, LEADER, SALES dan FAB milik mereka */}
          {canAssign && canAssignFab && (
            <>
              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={handleAssign}
                className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
              >
                <UserCog className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tugaskan ke Teknisi
                </span>
              </DropdownMenuItem>
            </>
          )}

          {/* Info: FAB tidak bisa ditugaskan */}
          {canAssign && !canAssignFab && (
            <>
              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
              <div className="rounded-xl gap-3 px-3 py-2 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-400">
                      Tugaskan ke Teknisi
                    </span>
                    <span className="text-xs text-slate-400">
                      {currentUser.role === "SALES" && !isSalesOwner
                        ? "Bukan milik Anda"
                        : fab.status === "AKTIF"
                          ? "FAB sudah Aktif"
                          : "Tidak dapat ditugaskan"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Edit */}
          {canEdit && (
            <>
              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={handleEdit}
                className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-orange-50 dark:focus:bg-orange-500/10"
              >
                <Pencil className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Edit FAB</span>
              </DropdownMenuItem>
            </>
          )}

          {/* Delete */}
          {canDelete && (
            <>
              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={handleDelete}
                className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Hapus FAB</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      {canEdit && (
        <FabDialog
          mode="edit"
          fab={fab}
          areaOptions={areaOptions}
          paketOptions={paketOptions}
          salesOptions={salesOptions}
          currentUser={currentUser}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {/* Delete Dialog */}
      {canDelete && (
        <FabDeleteDialog
          id={fab.id_fab}
          kodeFab={fab.kode_fab}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}

      {/* Assign Dialog */}
      {canAssign && (
        <FabAssignDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          fab={{
            id_fab: fab.id_fab,
            kode_fab: fab.kode_fab,
            nama_pelanggan: fab.nama_pelanggan,
            teknisiDitugaskan: (fab as any).teknisiDitugaskan,
          }}
          teknisiOptions={teknisiOptions}
        />
      )}
    </>
  );
}
