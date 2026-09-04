"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Pencil,
  Plus,
  Upload,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Users,
  BriefcaseBusiness,
  Wrench,
  Truck,
  ChevronDown,
  Venus,
  Mars,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
  currentUserRole?: string;
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

const ROLE_META: Record<
  "ADMIN" | "LEADER" | "SALES" | "TEKNISI" | "LOGISTIK",
  { icon: typeof ShieldCheck; color: string; label: string }
> = {
  ADMIN: { icon: ShieldCheck, color: "text-pink-600", label: "ADMIN" },
  LEADER: { icon: Users, color: "text-violet-600", label: "LEADER" },
  SALES: { icon: BriefcaseBusiness, color: "text-blue-600", label: "SALES" },
  TEKNISI: { icon: Wrench, color: "text-orange-600", label: "TEKNISI" },
  LOGISTIK: { icon: Truck, color: "text-emerald-600", label: "LOGISTIK" },
};

const JKL_META: Record<
  JenisKelamin,
  { icon: typeof Venus; color: string; label: string }
> = {
  LAKI_LAKI: { icon: Mars, color: "text-blue-600", label: "Laki-laki" },
  PEREMPUAN: { icon: Venus, color: "text-pink-600", label: "Perempuan" },
};

const STATUS_META: Record<
  "true" | "false",
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  true: { icon: CheckCircle2, color: "text-green-600", label: "Aktif" },
  false: { icon: XCircle, color: "text-red-600", label: "Nonaktif" },
};

export function UserFormDialog({
  mode,
  data,
  currentUserRole,
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

  const selectableRoles =
    currentUserRole === "LEADER"
      ? (["SALES", "TEKNISI"] as const)
      : (["ADMIN", "LEADER", "SALES", "TEKNISI", "LOGISTIK"] as const);

  useEffect(() => {
    if (mode === "create") {
      setRole(currentUserRole === "LEADER" ? "SALES" : "");
      return;
    }

    if (data?.role && selectableRoles.includes(data.role as any)) {
      setRole(data.role as Role);
      return;
    }

    if (data?.role) {
      setRole(selectableRoles[0] as Role);
    }
  }, [currentUserRole, data?.role, mode, selectableRoles]);

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

    if (currentUserRole === "LEADER" && !selectableRoles.includes(role as any)) {
      toast.error("Leader hanya bisa membuat user dengan role SALES atau TEKNISI.");
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
                h-12
                cursor-pointer
                rounded-2xl
                bg-gradient-to-r
                from-purple-600
                via-fuchsia-500
                to-sky-500
                font-semibold
                text-white
                active:scale-95 hover:scale-105 transition-transform
              "
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl active:scale-90 hover:scale-125 transition-transform"
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
                autoComplete="off"
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
                autoComplete="off"
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
                  autoComplete="new-password"
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                  <div className="flex items-center gap-2">
                    {jkl && (() => {
                      const meta = JKL_META[jkl as JenisKelamin];
                      const Icon = meta.icon;
                      return <Icon className={`h-4 w-4 ${meta.color}`} />;
                    })()}
                    <SelectValue placeholder="Pilih Jenis Kelamin">
                      {(value: string) => JKL_LABEL[value as JenisKelamin] ?? "Pilih Jenis Kelamin"}
                    </SelectValue>
                  </div>
                </SelectTrigger>

                <SelectContent side="bottom" align="start" className="rounded-2xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
                  <SelectItem value="LAKI_LAKI" className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                    <span className="flex items-center gap-2">
                      <Mars className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>Laki-laki</span>
                    </span>
                  </SelectItem>

                  <SelectItem value="PEREMPUAN" className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                    <span className="flex items-center gap-2">
                      <Venus className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                      <span>Perempuan</span>
                    </span>
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
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm transition-all hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    {role && (() => {
                      const meta = ROLE_META[role as keyof typeof ROLE_META];
                      const Icon = meta.icon;
                      return <Icon className={`h-4 w-4 ${meta.color}`} />;
                    })()}
                    <SelectValue placeholder="Pilih Role" />
                  </div>
                </SelectTrigger>

                <SelectContent side="bottom" align="start" className="max-h-60 overflow-y-auto rounded-2xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
                  {selectableRoles.map((item) => {
                    const meta = ROLE_META[item as keyof typeof ROLE_META];
                    const Icon = meta.icon;

                    return (
                      <SelectItem key={item} value={item} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                        <span className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
                          <span>{meta.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
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
                  <div className="flex items-center gap-2">
                    {(() => {
                      const meta = STATUS_META[status];
                      const Icon = meta.icon;
                      return <Icon className={`h-4 w-4 ${meta.color}`} />;
                    })()}
                    <SelectValue>
                      {(value: string) => (value === "true" ? "Aktif" : "Nonaktif")}
                    </SelectValue>
                  </div>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="true">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span>Aktif</span>
                    </span>
                  </SelectItem>

                  <SelectItem value="false">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>Nonaktif</span>
                    </span>
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
              className="rounded-2xl h-11 active:scale-95 hover:scale-105 transition-transform dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                h-11
                font-semibold
                bg-gradient-to-r
                from-purple-600
                via-fuchsia-500
                to-sky-500
                text-white
                active:scale-95 hover:scale-105 transition-transform
              "
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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