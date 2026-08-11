"use client";

import { useState } from "react";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Globe,
  MessageCircle,
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
import type { FabData, AreaOption, PaketOption, UserOption, CurrentUser } from "@/types/fab";

type FabActionsDropdownProps = {
  fab: FabData;
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
  currentUser: CurrentUser;
  canEdit: boolean;
  canDelete: boolean;
};

export function FabActionsDropdown({
  fab,
  areaOptions,
  paketOptions,
  salesOptions,
  currentUser,
  canEdit,
  canDelete,
}: FabActionsDropdownProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${fab.latitude},${fab.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openWhatsApp = () => {
    let cleanNumber = fab.no_hp.replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.substring(1);
    }
    const url = `https://wa.me/${cleanNumber}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <DropdownMenu>
        {/* DropdownMenuTrigger di sini dibangun dari Base UI (MenuPrimitive.Trigger),
            BUKAN Radix -- dia tidak punya prop "asChild". Pakai "asChild" + <Button>
            di dalamnya bikin dua elemen <button> ke-render bertumpuk (nested button,
            invalid HTML + hydration error) dan prop "asChild" ikut nyangkut ke DOM.
            Solusinya: pakai prop "render" dengan elemen <button> polos yang di-style
            pakai buttonVariants, jangan bungkus <Button> di dalam trigger. */}
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 cursor-pointer rounded-xl")}
            />
          }
        >
          <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/30"
        >
          {/* View */}
          <DropdownMenuItem onSelect={() => setViewOpen(true)} className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800">
            <Eye className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Lihat Detail</span>
          </DropdownMenuItem>

          {/* Google Maps */}
          <DropdownMenuItem onClick={openGoogleMaps} className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-sky-50 dark:focus:bg-sky-500/10">
            <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Buka di Google Maps</span>
          </DropdownMenuItem>

          {/* WhatsApp */}
          <DropdownMenuItem onClick={openWhatsApp} className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-green-50 dark:focus:bg-green-500/10">
            <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Hubungi via WhatsApp</span>
          </DropdownMenuItem>

          {/* Edit */}
          {canEdit && (
            <>
              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
              <DropdownMenuItem onSelect={() => setEditOpen(true)} className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-500/10">
                <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Edit FAB</span>
              </DropdownMenuItem>
            </>
          )}

          {/* Delete */}
          {canDelete && (
            <>
              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
              <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="rounded-xl gap-3 px-3 py-2 cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/10">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Hapus FAB</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Dialog */}
      <FabViewDialog
        fab={fab}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

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
          namaPelanggan={fab.nama_pelanggan}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}