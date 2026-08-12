"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ActivityDetailDialog } from "./ActivityDetailDialog";

type Activity = {
  id_log: number;
  type: string;
  description: string;
  id_user: number | null;
  createdAt: Date;
};

type RecentActivitiesProps = {
  activities: Activity[];
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (activities.length === 0) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
          <Sparkles className="text-indigo-400" size={28} />
        </div>

        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">
            Belum ada aktivitas
          </p>
          <p className="mt-1 max-w-xs text-sm text-slate-400 dark:text-slate-500">
            Aktivitas seperti penambahan user, FAB, atau BAA akan muncul
            di sini secara otomatis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityDetailDialog
          key={activity.id_log}
          activity={activity}
          trigger={
            <div className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-purple-200 hover:bg-purple-50/50 dark:border-slate-800 dark:hover:border-purple-700 dark:hover:bg-purple-500/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {activity.description}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isMounted
                    ? formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: localeId,
                      })
                    : "Memuat aktivitas..."}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-purple-500 dark:text-slate-600 dark:group-hover:text-purple-400 transition-colors" />
            </div>
          }
        />
      ))}
    </div>
  );
}
