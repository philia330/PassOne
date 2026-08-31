"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  X,
  Phone,
  MapPin,
  Router,
  Network,
  Boxes,
  Home,
  Calendar,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  MessageCircle,
  Wifi,
} from "lucide-react";
import type { NetworkPoint } from "@/lib/network-points";

const TYPE_ICON = { POP: Network, OLT: Router, ODP: Boxes, FAB: Home };

const TYPE_LABEL = {
  POP: "Point of Presence",
  OLT: "Optical Line Terminal",
  ODP: "Optical Distribution Point",
  FAB: "Pelanggan",
};

const TYPE_GRADIENT = {
  POP: "from-purple-600 via-fuchsia-500 to-sky-500",
  OLT: "from-purple-600 via-fuchsia-500 to-sky-500",
  ODP: "from-purple-600 via-fuchsia-500 to-sky-500",
  FAB: "from-purple-600 via-fuchsia-500 to-sky-500",
};

const FAB_STATUS_STYLE: Record<string, string> = {
  AKTIF: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  OPEN: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
};

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatWhatsapp(noHp?: string) {
  if (!noHp) return null;
  const digits = noHp.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard tidak tersedia, abaikan diam-diam
        }
      }}
      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      title="Salin"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="mt-0.5 rounded-lg bg-white p-1.5 shadow-sm dark:bg-slate-900">
        <Icon size={15} className="text-indigo-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{children}</div>
      </div>
    </div>
  );
}

// Overlay & panel dianimasikan lewat Framer Motion (AnimatePresence), BUKAN
// manual CSS transition + state `displayPoint` seperti versi sebelumnya.
// AnimatePresence otomatis "menahan" komponen yang lagi di-exit (termasuk
// props terakhirnya) sampai animasi exit-nya selesai -- jadi masalah
// "animasi keluar gak kesempatan muncul" beres tanpa trik manual apapun.
const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const panelVariants: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", damping: 30, stiffness: 220, duration: 0.35 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { type: "spring", damping: 30, stiffness: 220, duration: 0.3 },
  },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.25 },
  }),
};

export default function PointDetailDrawer({
  point,
  onClose,
}: {
  point: NetworkPoint | null;
  onClose: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Reset showPassword saat point berubah -- gunakan useEffect yang benar
  // untuk menghindari infinite re-render dari pola "adjusting state during render"
  useEffect(() => {
    // Reset showPassword setiap kali point berubah
    setShowPassword(false);
  }, [point?.id]);

  // Tutup pakai tombol Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {point && (
        <>
          {/* Overlay */}
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { type: "spring", damping: 30, stiffness: 220, duration: 0.35 } }}
            exit={{ x: "100%", opacity: 0, transition: { type: "spring", damping: 30, stiffness: 220, duration: 0.3 } }}
            className="fixed right-0 top-0 z-[1001] flex h-full w-full max-w-sm flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900"
          >
            {(() => {
              const Icon = TYPE_ICON[point.type];
              const waLink = point.type === "FAB" ? formatWhatsapp(point.no_hp) : null;
              const mapsLink = `https://www.google.com/maps?q=${point.lat},${point.lng}`;
              const portUsed = point.port_terpakai ?? null;
              const availablePorts = portUsed !== null && point.jumlah_port
                ? point.jumlah_port - portUsed
                : null;
              const portPercent =
                portUsed !== null && point.jumlah_port
                  ? Math.min(100, Math.round((portUsed / point.jumlah_port) * 100))
                  : null;

              return (
                <>
                  {/* Header gradient */}
                  <motion.div
                    className={`relative flex-shrink-0 bg-gradient-to-r ${TYPE_GRADIENT[point.type]} px-5 pb-8 pt-5 text-white`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                  >
                    {/* Tombol close -- pojok KIRI atas, di barisnya sendiri
                        (bukan sejajar sama teks di bawahnya). */}
                    <motion.button
                      onClick={onClose}
                      className="absolute left-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={18} />
                    </motion.button>

                    {/* pt-8 -- jarak dari tombol close, px-5 (bawaan induk)
                        -- mepet kiri, sejajar margin body di bawah. */}
                    <div className="pt-8">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
                        <Icon size={14} />
                        {TYPE_LABEL[point.type]}
                      </div>

                      {/* Kode + Status -- satu baris, mepet kiri, Status di
                          sebelah kanan Kode. */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {point.kode && (
                          <motion.span
                            className="rounded-full bg-white/20 px-3.5 py-1.5 font-mono text-sm font-bold tracking-wide"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {point.kode}
                          </motion.span>
                        )}
                        {point.type === "FAB" && point.info && (
                          <motion.span
                            className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                              FAB_STATUS_STYLE[point.info] ?? "bg-white/15"
                            }`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                          >
                            {point.info}
                          </motion.span>
                        )}
                      </div>

                      <motion.h2
                        className="mt-2 text-xl font-bold leading-tight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {point.name}
                      </motion.h2>
                    </div>
                  </motion.div>

                  {/* Foto */}
                  <div className="flex-shrink-0 px-5 pt-3">
                    <motion.div
                      className="h-36 w-full overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md dark:border-slate-900 dark:bg-slate-800"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15, duration: 0.25 }}
                    >
                      {point.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={point.foto} alt={point.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Icon size={32} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Body scrollable */}
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                    {/* ===== FAB ===== */}
                    {point.type === "FAB" && (
                      <>
                        {point.no_hp && (
                          <motion.div custom={0} variants={contentVariants} initial="initial" animate="animate">
                            <DetailRow icon={Phone} label="No. HP">
                              <div className="flex items-center justify-between gap-2">
                                <span>{point.no_hp}</span>
                                <div className="flex items-center gap-1">
                                  <CopyButton value={point.no_hp} />
                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-md p-1 text-emerald-500 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                      title="Chat WhatsApp"
                                    >
                                      <MessageCircle size={14} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </DetailRow>
                          </motion.div>
                        )}

                        {point.nik && (
                          <motion.div custom={1} variants={contentVariants} initial="initial" animate="animate">
                            <DetailRow icon={Boxes} label="NIK">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono">{point.nik}</span>
                                <CopyButton value={point.nik} />
                              </div>
                            </DetailRow>
                          </motion.div>
                        )}

                        {point.alamat && (
                          <motion.div custom={2} variants={contentVariants} initial="initial" animate="animate">
                            <DetailRow icon={MapPin} label="Alamat">
                              <p className="leading-relaxed">{point.alamat}</p>
                              <a
                                href={mapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                              >
                                Buka di Google Maps <ExternalLink size={11} />
                              </a>
                            </DetailRow>
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* ===== ODP ===== */}
                    {point.type === "ODP" && (
                      <>
                        {point.alamat && (
                          <motion.div custom={0} variants={contentVariants} initial="initial" animate="animate">
                            <DetailRow icon={MapPin} label="Alamat">
                              <p className="leading-relaxed">{point.alamat}</p>
                              <a
                                href={mapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                              >
                                Buka di Google Maps <ExternalLink size={11} />
                              </a>
                            </DetailRow>
                          </motion.div>
                        )}

                        <motion.div custom={1} variants={contentVariants} initial="initial" animate="animate">
                          <DetailRow icon={Wifi} label="Kapasitas Port">
                            <div className="flex items-center justify-between">
                              <span>
                                {portUsed ?? "-"} terpakai dari {point.jumlah_port ?? "-"} ({availablePorts ?? "-"} tersisa)
                              </span>
                            </div>
                            {portPercent !== null && (
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                  className={`h-full rounded-full ${
                                    portPercent >= 90 ? "bg-rose-500" : portPercent >= 70 ? "bg-orange-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${portPercent}%` }}
                                />
                              </div>
                            )}
                          </DetailRow>
                        </motion.div>

                        {point.connectedFabs && point.connectedFabs.length > 0 && (
                          <motion.div
                            custom={2}
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
                          >
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Pelanggan Terhubung ({point.connectedFabs.length})
                            </p>
                            <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                              {point.connectedFabs.map((f) => (
                                <li
                                  key={f.id}
                                  className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300"
                                >
                                  <span className="truncate">{f.name}</span>
                                  <span
                                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      FAB_STATUS_STYLE[f.status] ?? "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {f.status}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* ===== OLT ===== */}
                    {point.type === "OLT" && (
                      <>
                        {point.lokasi && (
                          <motion.div custom={0} variants={contentVariants} initial="initial" animate="animate">
                            <DetailRow icon={MapPin} label="Lokasi">
                              <p className="leading-relaxed">{point.lokasi}</p>
                              <a
                                href={mapsLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                              >
                                Buka di Google Maps <ExternalLink size={11} />
                              </a>
                            </DetailRow>
                          </motion.div>
                        )}

                        {point.ip_olt && (
                          <motion.div custom={1} variants={contentVariants} initial="initial" animate="animate">
                            <DetailRow icon={Wifi} label="IP Address">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono">{point.ip_olt}</span>
                                <CopyButton value={point.ip_olt} />
                              </div>
                            </DetailRow>
                          </motion.div>
                        )}

                        {(point.username_olt || point.password_olt) && (
                          <motion.div
                            custom={2}
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Kredensial Login
                            </p>
                            {point.username_olt && (
                              <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Username</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-slate-700 dark:text-slate-200">
                                    {point.username_olt}
                                  </span>
                                  <CopyButton value={point.username_olt} />
                                </div>
                              </div>
                            )}
                            {point.password_olt && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Password</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-slate-700 dark:text-slate-200">
                                    {showPassword ? point.password_olt : "••••••••"}
                                  </span>
                                  <button
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                  <CopyButton value={point.password_olt} />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* ===== POP ===== */}
                    {point.type === "POP" && point.alamat && (
                      <motion.div custom={0} variants={contentVariants} initial="initial" animate="animate">
                        <DetailRow icon={MapPin} label="Alamat">
                          <p className="leading-relaxed">{point.alamat}</p>
                          <a
                            href={mapsLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                          >
                            Buka di Google Maps <ExternalLink size={11} />
                          </a>
                        </DetailRow>
                      </motion.div>
                    )}

                    {/* Tanggal dibuat -- sama buat semua tipe */}
                    {point.createdAt && (
                      <motion.div
                        custom={point.type === "POP" ? 1 : 3}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                      >
                        <DetailRow icon={Calendar} label="Terdaftar Sejak">
                          <p>{formatDate(point.createdAt)}</p>
                        </DetailRow>
                      </motion.div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}