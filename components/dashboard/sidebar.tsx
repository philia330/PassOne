"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, UserCircle2, X, ChevronDown } from "lucide-react";
import ImagePreview from "@/components/shared/image-preview";
import { cn } from "@/lib/utils";

import {
  importExcelOptions,
  navigation,
  hasAccessToRole,
  normalizeRole,
} from "@/app/config/navigation";
import { RoleLabel, Role } from "@/lib/auth/roles";

type Settings = {
  app_name: string;
  app_subtitle: string;
};

function isActiveNavItem(href: string, pathname: string, searchParams: URLSearchParams) {
  const [hrefPath, hrefQuery] = href.split("?");
  if (hrefPath !== pathname) return false;
  if (!hrefQuery) return true;
  const view = new URLSearchParams(hrefQuery).get("view");
  return view ? searchParams.get("view") === view : true;
}

function getGroupStorageKey(groupTitle: string): string {
  const normalized = groupTitle.toLowerCase().replace(/\s+/g, "-");
  return `sidebar-group-${normalized}-expanded`;
}

function useCollapsibleGroups(initialGroups: typeof navigation) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};

    const stored: Record<string, boolean> = {};
    initialGroups.forEach((group) => {
      const key = getGroupStorageKey(group.title);
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        stored[group.title] = storedValue === "true";
      } else {
        stored[group.title] = true;
      }
    });

    return stored;
  });

  const groupContainsActive = useCallback(
    (group: typeof navigation[0]) => {
      return group.items.some((item) => isActiveNavItem(item.href, pathname, searchParams));
    },
    [pathname, searchParams]
  );

  const toggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroups((prev) => {
      const nextState = { ...prev, [groupTitle]: !(prev[groupTitle] ?? true) };
      localStorage.setItem(getGroupStorageKey(groupTitle), String(nextState[groupTitle]));
      return nextState;
    });
  }, []);

  useEffect(() => {
    initialGroups.forEach((group) => {
      const key = getGroupStorageKey(group.title);
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, String(groupContainsActive(group) || true));
      }
    });
  }, [initialGroups, groupContainsActive]);

  return { expandedGroups, toggleGroup, groupContainsActive };
}

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
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImportRoute, setPendingImportRoute] = useState<string | null>(null);

  const { expandedGroups, toggleGroup, groupContainsActive } = useCollapsibleGroups(navigation);

  const role =
    normalizeRole(session?.user?.role) ??
    (session?.user?.role ? (String(session.user.role).toUpperCase() as Role) : undefined);

  const visibleItemsForGroup = (group: (typeof navigation)[number]) =>
    group.items.filter((item) => hasAccessToRole(item.roles, role));

  const handleImportSelect = (route: string) => {
    setImportMenuOpen(false);
    setPendingImportRoute(route);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const route = pendingImportRoute;

    event.target.value = "";

    if (!file || !route) {
      setPendingImportRoute(null);
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(route, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Import Excel gagal");
      }

      alert(result.message || "Import Excel berhasil");
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan saat import Excel");
    } finally {
      setImporting(false);
      setPendingImportRoute(null);
    }
  };

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
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all lg:hidden"
        >
          <X size={22} />
        </button>
      </div>

      {/* Menu */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-4 py-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileUpload}
        />

        {navigation.map((group) => {
          const visibleItems = visibleItemsForGroup(group);

          if (visibleItems.length === 0) return null;

          const isExpanded = expandedGroups[group.title] ?? true;
          const hasActiveItem = groupContainsActive(group);

          return (
            <div key={group.title} className="mb-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 hover:bg-slate-800/50 ${
                  hasActiveItem ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  {group.title}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-out ${
                    isExpanded ? "rotate-0" : "-rotate-90"
                  } text-slate-500 group-hover:text-slate-300`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  isExpanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-1 pt-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveNavItem(item.href, pathname, searchParams);
                    const count = counts[item.href];

                    if (item.title === "Import Excel") {
                      return (
                        <div key={item.title} className="relative">
                          <button
                            type="button"
                            onClick={() => setImportMenuOpen((prev) => !prev)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
                              active
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <Icon size={20} />
                              <span>{item.title}</span>
                            </span>
                          </button>

                          {importMenuOpen && (
                            <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-lg">
                              {importExcelOptions.map((option) => (
                                <button
                                  key={option.label}
                                  type="button"
                                  onClick={() => handleImportSelect(option.route)}
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all"
                                >
                                  <span>{option.label}</span>
                                  <span className="text-xs text-slate-400">Excel</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
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
            </div>
          );
        })}
      </nav>

      {/* Footer: Profil + Logout */}
      <div className="flex-shrink-0 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-3">
      {session?.user?.foto ? (
        <ImagePreview
          src={session.user.foto}
          alt={session.user.nama}
          width={44}
          height={44}
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white hover:scale-105 active:scale-95"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}