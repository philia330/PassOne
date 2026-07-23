"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { JenisKelamin, Role } from "@prisma/client";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createUser, updateUser } from "../actions";

type UserData = {
  id_user: number;
  nama: string;
  username: string;
  email: string | null;
  no_hp: string | null;
  foto: string | null;
  role:
    | "ADMIN"
    | "LEADER"
    | "SALES"
    | "TEKNISI"
    | "LOGISTIK";
  jkl:
    | "LAKI_LAKI"
    | "PEREMPUAN";
  status: boolean;
};

type Props = {
  mode: "create" | "edit";
  data?: UserData;
};

export function UserFormDialog({
  mode,
  data,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [preview, setPreview] =
    useState<string | null>(
      data?.foto ?? null
    );

  const [role, setRole] =
    useState<Role | "">(
      data?.role ?? ""
    );

  const [jkl, setJkl] =
    useState<JenisKelamin | "">(
      data?.jkl ?? ""
    );

  const [status, setStatus] =
    useState<"true" | "false">(
      data?.status
        ? "true"
        : "false"
    );

  useEffect(() => {
    return () => {
      if (
        preview &&
        preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const resetForm = () => {
    if (mode === "create") {
      setRole("");
      setJkl("");
      setStatus("true");
      setPreview(null);
    } else {
      setRole(data?.role ?? "");
      setJkl(data?.jkl ?? "");
      setStatus(
        data?.status
          ? "true"
          : "false"
      );
      setPreview(data?.foto ?? null);
    }
  };

  const handleOpenChange = (
    value: boolean
  ) => {
    setOpen(value);

    if (value) {
      resetForm();
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toast.error(
        "File harus berupa gambar"
      );
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      toast.error(
        "Ukuran foto maksimal 2MB"
      );
      return;
    }

    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    setPreview(
      URL.createObjectURL(file)
    );
  };

  const handleSubmit = async (
    formData: FormData
  ) => {
    if (!role || !jkl) {
      toast.error(
        "Role dan Jenis Kelamin wajib dipilih."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createUser(formData);

        toast.success(
          "User berhasil ditambahkan"
        );
      } else if (data) {
        await updateUser(
          data.id_user,
          formData
        );

        toast.success(
          "User berhasil diperbarui"
        );
      }

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >      <DialogTrigger
        render={
          mode === "create" ? (
            <Button
              className="
                h-11
                cursor-pointer
                rounded-2xl
                bg-gradient-to-r
                from-purple-600
                via-fuchsia-500
                to-sky-500
                text-white
              "
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl"
            />
          )
        }
      >
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Tambah User
          </>
        ) : (
          <Pencil className="h-4 w-4 text-slate-500" />
        )}
      </DialogTrigger>

      <DialogContent
        className="
            flex
            h-full
            max-h-[100dvh]
            w-full
            max-w-full
            flex-col
            overflow-hidden
            rounded-none
            dark:bg-slate-900
            sm:h-auto
            sm:max-h-[90vh]
            sm:max-w-2xl
            sm:rounded-3xl
              "
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "create"
              ? "Tambah User"
              : "Edit User"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data user di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form
          action={handleSubmit}
          encType="multipart/form-data"
          className="
            flex
            min-h-0
            flex-1
            flex-col
          "
        >
          <div
            className="
              min-h-0
              flex-1
              space-y-5
              overflow-y-auto
              px-1
              py-4
            "
          >            {/* ================= FOTO USER ================= */}
            <div className="space-y-3">
              <label className="text-sm font-medium dark:text-slate-300">
                Foto User
              </label>

              <div className="flex items-center gap-5">
                {/* Preview */}
                <div
                  className="
                  flex h-24 w-24 items-center justify-center overflow-hidden
                  rounded-3xl border bg-slate-100
                  dark:border-slate-700 dark:bg-slate-800
                "
                >
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Preview Foto"
                      width={96}
                      height={96}
                      unoptimized={preview.startsWith("blob:")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      No Image
                    </span>
                  )}
                </div>

                {/* Upload */}
                <div className="space-y-2">
                  <label
                    htmlFor="foto"
                    className="
                      flex cursor-pointer items-center gap-2 rounded-xl border
                      border-slate-200 bg-white px-4 py-3 text-sm font-medium
                      transition hover:bg-slate-50
                      dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700
                    "
                  >
                    <Upload size={18} />
                    Pilih Foto
                  </label>

                  <Input
                    id="foto"
                    name="foto"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <p className="text-xs text-slate-400">
                    JPG, PNG, WEBP maksimal 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* ================= NAMA ================= */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">
                Nama
              </label>

              <Input
                name="nama"
                defaultValue={data?.nama}
                placeholder="Masukkan nama lengkap"
                required
                className="
  h-12
  rounded-2xl
  border-slate-200
  focus-visible:ring-purple-500
  dark:border-slate-700
  dark:bg-slate-800
  dark:text-slate-100
"
              />
            </div>

            {/* ================= USERNAME ================= */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">
                Username
              </label>

              <Input
                name="username"
                defaultValue={data?.username}
                placeholder="Masukkan username"
                required
                className="
  h-12
  rounded-2xl
  border-slate-200
  focus-visible:ring-purple-500
  dark:border-slate-700
  dark:bg-slate-800
  dark:text-slate-100
"
              />
            </div>

            {/* ================= PASSWORD ================= */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">
                Password
              </label>

              <Input
                name="password"
                type="password"
                required={mode === "create"}
                placeholder={
                  mode === "edit"
                    ? "Kosongkan jika tidak diubah"
                    : "Masukkan password"
                }
                className="
  h-12
  rounded-2xl
  border-slate-200
  focus-visible:ring-purple-500
  dark:border-slate-700
  dark:bg-slate-800
  dark:text-slate-100
"
              />
            </div>

            {/* ================= EMAIL & NO HP ================= */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-slate-300">
                  Email
                </label>

                <Input
                  name="email"
                  type="email"
                  defaultValue={data?.email ?? ""}
                  placeholder="email@gmail.com"
                  className="
                    h-12
                    rounded-2xl
                    border-slate-200
                    focus-visible:ring-purple-500
                  "
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-slate-300">
                  No HP
                </label>

                <Input
                  name="no_hp"
                  defaultValue={data?.no_hp ?? ""}
                  placeholder="08xxxxxxxxxx"
                  className="
                    h-12
                    rounded-2xl
                    border-slate-200
                    focus-visible:ring-purple-500
                  "
                />
              </div>
            </div>

            {/* ================= JENIS KELAMIN ================= */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">
                Jenis Kelamin
              </label>

              <Select
                value={jkl}
                onValueChange={(value) =>
                  setJkl(value as JenisKelamin)
                }
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200">
                  <SelectValue placeholder="Pilih Jenis Kelamin" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="LAKI_LAKI">
                    Laki-laki
                  </SelectItem>

                  <SelectItem value="PEREMPUAN">
                    Perempuan
                  </SelectItem>
                </SelectContent>
              </Select>

              <input
                type="hidden"
                name="jkl"
                value={jkl}
              />
            </div>

            {/* ================= ROLE ================= */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">
                Role
              </label>

              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as Role)
                }
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ADMIN">
                    ADMIN
                  </SelectItem>

                  <SelectItem value="LEADER">
                    LEADER
                  </SelectItem>

                  <SelectItem value="SALES">
                    SALES
                  </SelectItem>

                  <SelectItem value="TEKNISI">
                    TEKNISI
                  </SelectItem>

                  <SelectItem value="LOGISTIK">
                    LOGISTIK
                  </SelectItem>
                </SelectContent>
              </Select>

              <input
                type="hidden"
                name="role"
                value={role}
              />
            </div>

            {/* ================= STATUS ================= */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-slate-300">
                Status
              </label>

              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "true" | "false")
                }
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="true">
                    Aktif
                  </SelectItem>

                  <SelectItem value="false">
                    Nonaktif
                  </SelectItem>
                </SelectContent>
              </Select>

              <input
                type="hidden"
                name="status"
                value={status}
              />
            </div>

          </div>          {/* ================= FOOTER ================= */}
          <DialogFooter
            className="
      flex-shrink-0
      border-t
      border-slate-200
      bg-white
      pt-4
      dark:border-slate-800
      dark:bg-slate-900
    "
          >
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !role ||
                !jkl
              }
              className="
                rounded-2xl
                bg-gradient-to-r
                from-purple-600
                via-fuchsia-500
                to-sky-500
                text-white
              "
            >
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                ? "Tambah User"
                : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}