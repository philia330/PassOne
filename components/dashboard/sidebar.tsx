"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, UserCircle2, X } from "lucide-react";

import { navigation } from "@/app/config/navigation";
import { RoleLabel } from "@/lib/auth/roles";

type Settings = {
  app_name: string;
  app_subtitle: string;
};

export default function Sidebar({
  settings,
  open,
  onClose,
}: {
  settings: Settings;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const role = session?.user?.role;

  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/sidebar-counts")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setCounts(data))
      .catch(() => setCounts({}));
  }, [pathname, session?.user]);

  // Tutup sidebar otomatis tiap pindah halaman (di mobile)
  useEffect(() => {
    onClose();
  }, [pathname]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-shrink-0 flex-col bg-slate-900 text-white transition-transform duration-300 dark:bg-slate-950 lg:sticky lg:top-0 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo + tombol close (cuma muncul di mobile) */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 px-6 py-7">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">{settings.app_name}</h1>
          <p className="mt-1 text-sm text-slate-400">{settings.app_subtitle}</p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X size={22} />
        </button>
      </div>

      {/* Menu */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-4 py-6">
        {navigation.map((group) => {
          const visibleItems = role
            ? group.items.filter((item) => item.roles.includes(role))
            : [];

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-8">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  const count = counts[item.href];

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                        active
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={20} />
                        <span>{item.title}</span>
                      </span>

                      {typeof count === "number" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer: Profil + Logout */}
      <div className="flex-shrink-0 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-3">
          {session?.user?.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.foto}
              alt={session.user.nama}
              className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-700"
            />
          ) : (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/20 ring-2 ring-slate-700">
              <UserCircle2 size={26} className="text-indigo-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {session?.user?.nama ?? "..."}
            </p>
            <p className="truncate text-xs text-slate-400">
              {role ? RoleLabel[role] : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}