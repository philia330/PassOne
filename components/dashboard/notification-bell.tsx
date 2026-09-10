"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, CheckCircle2, Info, PackageX, UserCog, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id_notification: number;
  id_user: number;
  title: string;
  message: string;
  link: string | null;
  type: string;
  is_read: boolean;
  createdAt: string;
};

const SEVERITY_ICON = {
  danger: PackageX,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const SEVERITY_COLOR = {
  danger: "text-red-500 bg-red-50 dark:bg-red-500/20",
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-500/20",
  info: "text-sky-500 bg-sky-50 dark:bg-sky-500/20",
  success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20",
};

const TYPE_TO_SEVERITY: Record<string, "warning" | "danger" | "info" | "success"> = {
  FAB_OPEN: "warning", // belum ditugaskan -- disamain sama halaman notifikasi lengkap
  FAB_ASSIGNED: "info",
  FAB_STATUS_CHANGE: "info",
  BAA_CREATED: "info",
  SYSTEM: "warning",
  FAB_COMPLETED: "success",
};

// Icon per JENIS notifikasi (bukan cuma severity) -- supaya beda tampilan
// antara FAB yang belum ditugaskan, sudah ditugaskan, dan sudah selesai,
// sama persis kayak di halaman "Semua Notifikasi". Tipe lain yang belum
// disebut di sini otomatis jatuh ke icon severity biasa (lihat getIcon).
const TYPE_ICON: Partial<Record<string, React.ElementType>> = {
  FAB_OPEN: PackageX, // belum ditugaskan ke teknisi manapun
  FAB_ASSIGNED: UserCog, // sudah ditugaskan ke seorang teknisi
  FAB_COMPLETED: CheckCircle2, // sudah selesai dikerjakan
};

function getSeverity(type: string): "warning" | "danger" | "info" | "success" {
  return TYPE_TO_SEVERITY[type] || "info";
}

function getIcon(type: string, severity: "warning" | "danger" | "info" | "success") {
  return TYPE_ICON[type] ?? SEVERITY_ICON[severity];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications dari model Notification
  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        // total = jumlah notifikasi sebenarnya (bukan cuma yang di-preview
        // di dropdown, yang dibatasi maksimal 20).
        setTotal(data.total ?? data.notifications?.length ?? 0);
      }
    } catch {
      // silent fail
    }
  }

  // Fetch on mount and poll every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    // Mark notification as read and navigate
  const handleNotificationClick = async (item: NotificationItem) => {
    // Notifikasi "live" (FAB open / material kritis yang dihitung real-time)
    // punya id negatif -- bukan baris asli di DB, jadi tidak perlu (dan
    // tidak bisa) di-mark-read lewat API. Dia akan tetap tampil selama
    // kondisinya masih ada, dan hilang sendiri begitu FAB-nya ditugaskan
    // atau stok materialnya di-restok.
    if (!item.is_read && item.id_notification > 0) {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idNotification: item.id_notification }),
        });
        setItems((prev) =>
          prev.map((n) =>
            n.id_notification === item.id_notification ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // continue even if mark read fails
      }
    }

    // Navigate if link exists
    if (item.link) {
      window.location.href = item.link;
    }
    setOpen(false);
  };

  // Show only 5 latest notifications
  const latestNotifications = items.slice(0, 5);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-slate-200 p-3 transition hover:bg-slate-100 hover:scale-110 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800"
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-extrabold leading-none text-white shadow-lg shadow-red-500/50 animate-pulse dark:border-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        // PERBAIKAN MOBILE: dulu dropdown ini `absolute` tanpa batas tinggi
        // total -- cuma bagian list yang di-scroll (max-h-[calc(100vh-200px)]),
        // jadi kalau header+list+footer gabungan lebih tinggi dari sisa layar
        // di bawah tombol bell, footer ("Lihat Semua Notifikasi") kedorong
        // keluar layar dan gak ada cara scroll ke situ. Sekarang:
        // - di mobile (<sm): posisi `fixed` dari atas viewport (bukan relatif
        //   ke tombol), lebar menyesuaikan layar, dan `max-h-[calc(100vh-90px)]`
        //   membatasi TOTAL tinggi dropdown (header+list+footer).
        // - flex-col + list `flex-1 min-h-0 overflow-y-auto` supaya cuma
        //   list yang scroll, sementara header & footer (`shrink-0`) selalu
        //   kebagian ruang dan gak pernah terpotong.
        // - di layar sm: ke atas, balik ke perilaku dropdown biasa (absolute,
        //   lebar tetap 320px) seperti sebelumnya.
        <div className="fixed inset-x-4 top-[70px] z-50 mx-auto flex max-h-[calc(100vh-90px)] w-auto max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:mx-0 sm:w-80 sm:max-w-none">
          {/* Header */}
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifikasi</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {unreadCount === 0 ? "Semua sudah dibaca" : `${unreadCount} belum dibaca`}
            </p>
          </div>

          {/* Notification list */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                🎉 Tidak ada notifikasi
              </div>
            ) : (
              latestNotifications.map((item) => {
                const severity = getSeverity(item.type);
                const Icon = getIcon(item.type, severity);
                return (
                  <button
                    key={item.id_notification}
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      "flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800",
                      !item.is_read && "bg-purple-50/50 dark:bg-purple-500/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                        SEVERITY_COLOR[severity]
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            item.is_read
                              ? "text-slate-500 dark:text-slate-400"
                              : "text-slate-800 dark:text-slate-100"
                          )}
                        >
                          {item.title}
                        </p>
                        {!item.is_read && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer - Lihat Semua (sekarang SELALU dalam batas layar) */}
          <div className="shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <Link
              href="/workspace?view=notifications"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-50 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
            >
              Lihat Semua Notifikasi ({total})
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}