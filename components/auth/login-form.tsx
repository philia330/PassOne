"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { checkUserStatus } from "@/app/login/actions";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Settings = {
  login_title: string;
  login_subtitle: string;
  footer_text: string;
};

export default function LoginForm({ settings }: { settings: Settings }) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Username dan Password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const status = await checkUserStatus(username);

      if (!status.exists) {
        toast.error("Username atau Password salah.");
        return;
      }

      if (!status.active) {
        toast.error("Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.");
        return;
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        toast.error("Username atau Password salah.");
        return;
      }

      toast.success("Login berhasil.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[32px] border border-white/40 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10">

        {/* Header */}
        <div>
          <span className="rounded-full bg-purple-100 px-4 py-1 text-sm font-semibold text-purple-700">
            Secure Login
          </span>

          <h2 className="mt-5 font-[family:var(--font-jakarta)] text-3xl font-extrabold text-slate-800 sm:text-4xl">
            {settings.login_title}
          </h2>

          <p className="mt-2 text-slate-500">
            {settings.login_subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">

          {/* Username */}
          <div>
            <label className="mb-2 block font-medium text-slate-700">
              Username / Email
            </label>

            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />

              <Input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="Masukkan Username atau Email"
  autoComplete="off"
  className="
    h-12
    rounded-2xl
    border-slate-200
    bg-white
    pl-12
    text-slate-800
    placeholder:text-slate-400
    shadow-sm
    focus:border-purple-500
    focus:ring-2
    focus:ring-purple-200
    sm:h-14
  "
/>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block font-medium text-slate-700">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />

              <Input
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Masukkan Password"
  autoComplete="current-password"
  className="
    h-12
    rounded-2xl
    border-slate-200
    bg-white
    pl-12
    pr-14
    text-slate-800
    placeholder:text-slate-400
    shadow-sm
    focus:border-purple-500
    focus:ring-2
    focus:ring-purple-200
    sm:h-14
  "
/>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-600"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Button */}
          <Button
            type="submit"
            disabled={loading}
            className="
              h-12
              w-full
              rounded-2xl
              bg-gradient-to-r
              from-purple-600
              via-fuchsia-500
              to-sky-500
              text-base
              font-semibold
              text-white
              disabled:opacity-70
              sm:h-14
              sm:text-lg
            "
          >
            {loading ? "Loading..." : "Login"}
          </Button>

        </form>

        <div className="mt-8 border-t pt-6 text-center text-sm text-slate-500 sm:mt-10">
          {settings.footer_text}
        </div>

      </div>
    </div>
  );
}