"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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

// Diberi anotasi eksplisit `: Variants` -- tanpa ini, TypeScript nge-infer
// `ease: "easeOut"` sebagai tipe `string` biasa (widened), padahal Framer
// Motion butuh union literal type khusus (mis. "easeOut" | "easeIn" | ...
// | number[]). Dengan anotasi ini, literal string-nya "dipertahankan"
// sesuai tipe yang diharapkan, jadi cocok dengan prop `variants` di motion.div.
const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.3,
    },
  }),
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
      <DialogContent className="sm:max-w-md rounded-3xl overflow-hidden">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader>
                <motion.div
                  custom={0}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <DialogTitle className="flex items-center gap-3">
                    <motion.span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${getActivityColor(activity.type)}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    >
                      {getActivityIcon(activity.type)}
                    </motion.span>
                    <span className="text-base">Detail Aktivitas</span>
                  </DialogTitle>
                </motion.div>
              </DialogHeader>

              <motion.div className="space-y-4 py-4">
                {/* Deskripsi */}
                <motion.div
                  custom={1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Deskripsi</p>
                  <motion.p
                    className="font-medium dark:text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    {activity.description}
                  </motion.p>
                </motion.div>

                {/* Tipe Aktivitas & Waktu */}
                <motion.div className="grid grid-cols-2 gap-4">
                  <motion.div
                    custom={2}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tipe Aktivitas</p>
                    <motion.span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ${getActivityColor(activity.type)}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {activity.type.replace(/_/g, " ")}
                    </motion.span>
                  </motion.div>

                  {/* Waktu */}
                  <motion.div
                    custom={3}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Waktu</p>
                    <motion.p
                      className="font-medium dark:text-white text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      {format(new Date(activity.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </motion.p>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="rounded-xl"
                  >
                    Tutup
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}