"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Info, PackageX } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  severity: "warning" | "danger" | "info";
};

const SEVERITY_ICON = {
  danger: PackageX,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR = {
  danger: "text-red-500 bg-red-50",
  warning: "text-amber-500 bg-amber-50",
  info: "text-sky-500 bg-sky-50",
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setItems(data.notifications ?? []);
        }
      } catch {
        // silent fail, biarin badge kosong
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000); // refresh tiap 1 menit
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-slate-200 p-3 transition hover:bg-slate-100"
      >
        <Bell size={20} />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-800">Notifikasi</h3>
            <p className="text-xs text-slate-400">
              {items.length === 0 ? "Semua aman, tidak ada yang perlu ditindak." : `${items.length} hal perlu perhatian`}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                🎉 Tidak ada notifikasi
              </div>
            ) : (
              items.map((item) => {
                const Icon = SEVERITY_ICON[item.severity];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${SEVERITY_COLOR[item.severity]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.description}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}