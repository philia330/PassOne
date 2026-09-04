"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCircle2, Loader2, Trash2, ArrowLeft, PackageX, AlertTriangle, Info, UserCog, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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

const TYPE_TO_SEVERITY: Record<string, "warning" | "danger" | "info"> = {
  FAB_ASSIGNED: "info",
  FAB_STATUS_CHANGE: "info",
  BAA_CREATED: "info",
  SYSTEM: "warning",
  FAB_COMPLETED: "success",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  FAB_ASSIGNED: PackageX,
  FAB_STATUS_CHANGE: Info,
  BAA_CREATED: Info,
  SYSTEM: AlertTriangle,
  FAB_COMPLETED: CheckCircle2,
};

const TYPE_COLOR = {
  info: "text-sky-500 bg-sky-50 dark:bg-sky-500/20",
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-500/20",
  danger: "text-red-500 bg-red-50 dark:bg-red-500/20",
  success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20",
};

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
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function fetchNotifications(requestPage: number, signal?: AbortSignal) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications/all?page=${requestPage}&pageSize=${pageSize}`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (signal?.aborted) return;
        setNotifications(data.notifications ?? []);
        setTotal(data.total ?? 0);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Gagal memuat notifikasi");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetchNotifications(page, controller.signal);
    return () => controller.abort();
  }, [page]);

    const handleNotificationClick = async (item: NotificationItem) => {
    // Item live (id negatif) tidak bisa di-mark-read lewat API -- lihat
    // penjelasan di NotificationBell.
    if (!item.is_read && item.id_notification > 0) {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idNotification: item.id_notification }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id_notification === item.id_notification ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // continue even if mark read fails
      }
    }

    if (item.link) {
      router.push(item.link);
    }
  };

  // Handle mark as read only (without navigation)
  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNotification: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id_notification === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      toast.error("Gagal menandai notifikasi");
    }
  };

  const handleMarkAllAsRead = () => {
    setIsMarkingAll(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
        if (res.ok) {
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setUnreadCount(0);
          toast.success("Semua notifikasi ditandai sudah dibaca");
        }
      } catch {
        toast.error("Gagal menandai notifikasi");
      } finally {
        setIsMarkingAll(false);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setIsDeleting(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/notifications/${deleteId}`, { method: "DELETE" });
        if (res.ok) {
          const deleted = notifications.find((n) => n.id_notification === deleteId);
          setNotifications((prev) => prev.filter((n) => n.id_notification !== deleteId));
          if (deleted && !deleted.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          setTotal((prev) => Math.max(0, prev - 1));
          toast.success("Notifikasi dihapus");
        }
      } catch {
        toast.error("Gagal menghapus notifikasi");
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    });
  };

  // Page range for pagination
  const pageRange = [];
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  for (let i = start; i <= end; i++) {
    pageRange.push(i);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Semua Notifikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="rounded-xl gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-500/10"
            >
              {isMarkingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <Card className="rounded-3xl border shadow-xl dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Bell className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              Tidak ada notifikasi
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Notifikasi akan muncul di sini ketika Anda menerima tugas atau informasi penting.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((item) => {
              const severity = TYPE_TO_SEVERITY[item.type] || "info";
              const Icon = TYPE_ICON[item.type] || Info;
              const colorClass = TYPE_COLOR[severity];
              const isFabNotification = item.type === "FAB_ASSIGNED" || item.type === "FAB_OPEN" || item.type === "FAB_COMPLETED";

              return (
                <div
                  key={item.id_notification}
                  className={cn(
                    "group flex items-start gap-3 p-4 transition",
                    !item.is_read ? "bg-purple-50/50 dark:bg-purple-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    item.link && "cursor-pointer"
                  )}
                  onClick={() => item.link && handleNotificationClick(item)}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                      colorClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={cn(
                          "text-sm font-semibold",
                          item.is_read
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-slate-800 dark:text-slate-100"
                        )}
                      >
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {formatTimeAgo(item.createdAt)}
                    </p>

                    {/* FAB Action Buttons */}
                    {isFabNotification && item.link && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(item);
                          }}
                          className="h-8 rounded-lg text-xs font-medium border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-500/10"
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          {item.type === "FAB_ASSIGNED" ? "Lihat FAB" : "Buka FAB"}
                        </Button>
                      </div>
                    )}
                  </div>

                                    {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {!item.is_read && !isFabNotification && item.id_notification > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id_notification);
                        }}
                        className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                        title="Tandai sudah dibaca"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {item.id_notification > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(item.id_notification);
                        }}
                        className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Hapus notifikasi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && notifications.length > 0 && totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} dari {total}
              </p>
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && setPage(page - 1)}
                      className={cn(
                        "cursor-pointer rounded-xl",
                        page === 1 && "opacity-50 pointer-events-none"
                      )}
                    />
                  </PaginationItem>
                  {start > 1 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(1)} className="cursor-pointer rounded-xl">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {start > 2 && <PaginationEllipsis />}
                    </>
                  )}
                  {pageRange.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => setPage(p)}
                        isActive={p === page}
                        className={cn(
                          "cursor-pointer rounded-xl",
                          p === page && "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white hover:bg-purple-600"
                        )}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {end < totalPages && (
                    <>
                      {end < totalPages - 1 && <PaginationEllipsis />}
                      <PaginationItem>
                        <PaginationLink onClick={() => setPage(totalPages)} className="cursor-pointer rounded-xl">
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < totalPages && setPage(page + 1)}
                      className={cn(
                        "cursor-pointer rounded-xl",
                        page === totalPages && "opacity-50 pointer-events-none"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus notifikasi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Notifikasi yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
