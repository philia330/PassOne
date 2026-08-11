"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, FileText, Settings, Package, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type Activity = {
  id_log: number;
  type: string;
  description: string;
  id_user: number | null;
  createdAt: Date;
};

type ActivityDetailDialogProps = {
  activity: Activity;
  trigger: React.ReactNode;
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  USER: <User className="h-5 w-5" />,
  FAB: <FileText className="h-5 w-5" />,
  BAA: <FileText className="h-5 w-5" />,
  AREA: <MapPin className="h-5 w-5" />,
  POP: <MapPin className="h-5 w-5" />,
  OLT: <MapPin className="h-5 w-5" />,
  ODP: <MapPin className="h-5 w-5" />,
  ONT: <MapPin className="h-5 w-5" />,
  PAKET: <Package className="h-5 w-5" />,
  MATERIAL: <Package className="h-5 w-5" />,
  SETTINGS: <Settings className="h-5 w-5" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CREATED: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  UPDATED: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  DELETED: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  DEFAULT: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
};

const getActivityColor = (type: string): string => {
  if (type.includes("CREATED")) return ACTIVITY_COLORS.CREATED;
  if (type.includes("UPDATED")) return ACTIVITY_COLORS.UPDATED;
  if (type.includes("DELETED")) return ACTIVITY_COLORS.DELETED;
  return ACTIVITY_COLORS.DEFAULT;
};

const getActivityIcon = (type: string): React.ReactNode => {
  const typeUpper = type.toUpperCase();
  for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
    if (typeUpper.includes(key)) return icon;
  }
  return <Settings className="h-5 w-5" />;
};

export function ActivityDetailDialog({ activity, trigger }: ActivityDetailDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<button type="button" className="w-full text-left" />}
      >
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </span>
            <span className="text-base">Detail Aktivitas</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Deskripsi */}
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
            <p className="font-medium dark:text-white">{activity.description}</p>
          </div>

          {/* Tipe Aktivitas & Waktu */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tipe Aktivitas</p>
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ${getActivityColor(activity.type)}`}>
                {activity.type.replace(/_/g, " ")}
              </span>
            </div>

            {/* Waktu */}
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Waktu</p>
              <p className="font-medium dark:text-white text-sm">
                {format(new Date(activity.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-xl"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}