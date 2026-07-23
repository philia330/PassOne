"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteOlt } from "../actions";

export const DeleteOltDialog = ({ id, name }: { id: number; name: string }) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOlt(id);
      toast.success("OLT berhasil dihapus");
      setOpen(false);
    } catch {
      toast.error(
        "Gagal menghapus, pastikan OLT ini tidak sedang dipakai oleh data ODP"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer rounded-xl"
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        }
      />
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus data OLT?</AlertDialogTitle>
          <AlertDialogDescription>
            Data{" "}
            <span className="font-semibold text-slate-800 dark:text-white">
              {name}
            </span>{" "}
            akan dihapus permanen dan tidak dapat dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="cursor-pointer rounded-2xl"
            disabled={isDeleting}
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="cursor-pointer rounded-2xl bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};