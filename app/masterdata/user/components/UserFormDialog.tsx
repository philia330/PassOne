"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Upload, Eye, EyeOff } from "lucide-react";
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

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "ADMIN",
  LEADER: "LEADER",
  SALES: "SALES",
  TEKNISI: "TEKNISI",
  LOGISTIK: "LOGISTIK",
};

const JKL_LABEL: Record<JenisKelamin, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
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

  const [showPassword, setShowPassword] = useState(false);

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
      setShowPassword(false);
    } else {
      setRole(data?.role ?? "");
      setJkl(data?.jkl ?? "");
      setStatus(
        data?.status
          ? "true"
          : "false"
      );
      setPreview(data?.foto ?? null);
      setShowPassword(false);
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

  // Cuma boleh angka, maksimal 13 digit -- batas wajar nomor HP Indonesia
  const handleNoHpChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 13);
    e.target.value = digitsOnly;
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
                active:scale-95 transition-transform
              "
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl active:scale-90 transition-transform"
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
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 active:scale-90 transition-all dark:text-orange-400 dark:hover:text-orange-300" />
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

              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
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
  pr-12
  focus-visible:ring-purple-500
  dark:border-slate-700
  dark:bg-slate-800
  dark:text-slate-100
"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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
                  type="tel"
                  inputMode="numeric"
                  maxLength={13}
                  defaultValue={data?.no_hp ?? ""}
                  onChange={handleNoHpChange}
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
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 hover:scale-105 active:scale-95 transition-all">
                  <SelectValue placeholder="Pilih Jenis Kelamin">
                    {(value: string) => JKL_LABEL[value as JenisKelamin] ?? "Pilih Jenis Kelamin"}
                  </SelectValue>
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
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 hover:scale-105 active:scale-95 transition-all">
                  <SelectValue placeholder="Pilih Role">
                    {(value: string) => ROLE_LABEL[value as Role] ?? "Pilih Role"}
                  </SelectValue>
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
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 hover:scale-105 active:scale-95 transition-all">
                  <SelectValue>
                    {(value: string) => (value === "true" ? "Aktif" : "Nonaktif")}
                  </SelectValue>
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
              className="rounded-2xl active:scale-95 transition-transform"
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
                active:scale-95 transition-transform
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