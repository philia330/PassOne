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

import { deleteUser } from "../actions";

type Props = {
  id: number;
  name: string;
};

export function DeleteUserDialog({
  id,
  name,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteUser(id);

      toast.success("User berhasil dihapus");

      setOpen(false);
    } catch {
      toast.error(
        "Gagal menghapus user. Pastikan user tidak sedang digunakan."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer rounded-xl"
          />
        }
      >
        <Trash2 className="h-4 w-4 text-rose-500" />
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus User?
          </AlertDialogTitle>

          <AlertDialogDescription>
            User{" "}
            <span className="font-semibold">
              {name}
            </span>{" "}
            akan dihapus secara permanen dan tidak dapat
            dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="cursor-pointer rounded-2xl"
          >
            Batal
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="cursor-pointer rounded-2xl bg-rose-600 hover:bg-rose-700"
          >
            {isDeleting
              ? "Menghapus..."
              : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}