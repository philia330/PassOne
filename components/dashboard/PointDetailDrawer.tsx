"use client";

import { useEffect, useState } from "react";
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

export default function PointDetailDrawer({
  point,
  onClose,
}: {
  point: NetworkPoint | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Data yang BENERAN dipakai buat render, terpisah dari prop `point`.
  // Kenapa perlu: begitu drawer ditutup, parent langsung set `point` jadi
  // null -- tapi animasi keluar (350ms) butuh WAKTU, jadi kita harus tetap
  // punya data terakhir buat dirender SELAMA animasi keluar berlangsung.
  // Kalau langsung pakai `point` di JSX, begitu dia null, kontennya ikut
  // hilang seketika -- itu sebabnya animasi keluar sebelumnya gak pernah
  // kelihatan.
  const [displayPoint, setDisplayPoint] = useState<NetworkPoint | null>(null);

  // Reset showPassword dilakukan SAAT RENDER, bukan di dalam useEffect --
  // pola resmi React "adjusting state during render" buat derived state
  // yang perlu di-reset kalau titik yang dipilih (point.id) berubah.
  const [lastPointId, setLastPointId] = useState<string | null>(null);
  if (point && point.id !== lastPointId) {
    setLastPointId(point.id);
    setShowPassword(false);
  }

  // Handle open & close animation
  useEffect(() => {
    if (point) {
      // Buka: simpan data buat dirender, tampilkan panel (isVisible),
      // baru SETELAH itu (2x rAF supaya browser sempat "commit" kondisi
      // awal translate-x-full dulu) flip ke mounted=true biar transisinya
      // beneran kejalan, bukan langsung loncat ke posisi akhir.
      setDisplayPoint(point);
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true));
      });
    } else {
      // Tutup: cuma flip mounted=false dulu (memicu transisi slide+fade
      // keluar). displayPoint SENGAJA tidak langsung dikosongkan supaya
      // konten tetap kelihatan selama animasi keluar berjalan. Baru
      // setelah animasi selesai (350ms), isVisible & displayPoint
      // di-reset supaya drawer bener-bener unmount dari DOM.
      setMounted(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setDisplayPoint(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [point]);

  // Tutup pakai tombol Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!isVisible || !displayPoint) return null;

  const activePoint = displayPoint;
  const Icon = TYPE_ICON[activePoint.type];
  const waLink = activePoint.type === "FAB" ? formatWhatsapp(activePoint.no_hp) : null;
  const mapsLink = `https://www.google.com/maps?q=${activePoint.lat},${activePoint.lng}`;
  const portUsed =
    typeof activePoint.jumlah_port === "number" && typeof activePoint.stok_port === "number"
      ? activePoint.jumlah_port - activePoint.stok_port
      : null;
  const portPercent =
    portUsed !== null && activePoint.jumlah_port
      ? Math.min(100, Math.round((portUsed / activePoint.jumlah_port) * 100))
      : null;

  return (
    <>
      {/* Overlay with fade transition */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Panel with slide from right (in) + slide to right (out) */}
      <div
        className={`fixed right-0 top-0 z-[1001] flex h-full w-full max-w-sm flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 ${
          mounted
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
        style={{
          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease-out',
        }}
      >
        {/* Header gradient */}
        <div className={`relative flex-shrink-0 bg-gradient-to-r ${TYPE_GRADIENT[activePoint.type]} px-5 pb-8 pt-5 text-white`}>
          {/* Tombol close */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition-all duration-200 hover:bg-white/25 hover:scale-110 active:scale-95"
          >
            <X size={18} />
          </button>

          {/* pt-8 -- kasih jarak dari tombol close di atas, px-5 -- mepet
              kiri, sejajar sama margin body di bawah (bukan px-9 lagi). */}
          <div className="pt-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
              <Icon size={14} />
              {TYPE_LABEL[activePoint.type]}
            </div>

            {/* Kode + Status -- satu baris, mepet kiri, Status di sebelah
                kanan Kode. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activePoint.kode && (
                <span className="rounded-full bg-white/20 px-3.5 py-1.5 font-mono text-sm font-bold tracking-wide">
                  {activePoint.kode}
                </span>
              )}
              {activePoint.type === "FAB" && activePoint.info && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                    FAB_STATUS_STYLE[activePoint.info] ?? "bg-white/15"
                  }`}
                >
                  {activePoint.info}
                </span>
              )}
            </div>

            <h2 className="mt-2 text-xl font-bold leading-tight">{activePoint.name}</h2>
          </div>
        </div>

        {/* Foto -- dikasih jarak (pt-3) dari header, tidak overlap lagi */}
        <div className="flex-shrink-0 px-5 pt-3">
          <div className="h-36 w-full overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md dark:border-slate-900 dark:bg-slate-800">
            {activePoint.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activePoint.foto} alt={activePoint.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Body scrollable */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {/* ===== FAB ===== */}
          {activePoint.type === "FAB" && (
            <>
              {activePoint.no_hp && (
                <DetailRow icon={Phone} label="No. HP">
                  <div className="flex items-center justify-between gap-2">
                    <span>{activePoint.no_hp}</span>
                    <div className="flex items-center gap-1">
                      <CopyButton value={activePoint.no_hp} />
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
              )}

              {activePoint.nik && (
                <DetailRow icon={Boxes} label="NIK">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono">{activePoint.nik}</span>
                    <CopyButton value={activePoint.nik} />
                  </div>
                </DetailRow>
              )}

              {activePoint.alamat && (
                <DetailRow icon={MapPin} label="Alamat">
                  <p className="leading-relaxed">{activePoint.alamat}</p>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    Buka di Google Maps <ExternalLink size={11} />
                  </a>
                </DetailRow>
              )}
            </>
          )}

          {/* ===== ODP ===== */}
          {activePoint.type === "ODP" && (
            <>
              {activePoint.alamat && (
                <DetailRow icon={MapPin} label="Alamat">
                  <p className="leading-relaxed">{activePoint.alamat}</p>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    Buka di Google Maps <ExternalLink size={11} />
                  </a>
                </DetailRow>
              )}

              <DetailRow icon={Wifi} label="Kapasitas Port">
                <div className="flex items-center justify-between">
                  <span>
                    {portUsed ?? "-"} terpakai dari {activePoint.jumlah_port ?? "-"} ({activePoint.stok_port ?? "-"} tersisa)
                  </span>
                </div>
                {portPercent !== null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full ${portPercent >= 90 ? "bg-rose-500" : portPercent >= 70 ? "bg-orange-500" : "bg-emerald-500"}`}
                      style={{ width: `${portPercent}%` }}
                    />
                  </div>
                )}
              </DetailRow>

              {activePoint.connectedFabs && activePoint.connectedFabs.length > 0 && (
                <div className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Pelanggan Terhubung ({activePoint.connectedFabs.length})
                  </p>
                  <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                    {activePoint.connectedFabs.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
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
                </div>
              )}
            </>
          )}

          {/* ===== OLT ===== */}
          {activePoint.type === "OLT" && (
            <>
              {activePoint.lokasi && (
                <DetailRow icon={MapPin} label="Lokasi">
                  <p className="leading-relaxed">{activePoint.lokasi}</p>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    Buka di Google Maps <ExternalLink size={11} />
                  </a>
                </DetailRow>
              )}

              {activePoint.ip_olt && (
                <DetailRow icon={Wifi} label="IP Address">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono">{activePoint.ip_olt}</span>
                    <CopyButton value={activePoint.ip_olt} />
                  </div>
                </DetailRow>
              )}

              {(activePoint.username_olt || activePoint.password_olt) && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kredensial Login</p>
                  {activePoint.username_olt && (
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Username</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-700 dark:text-slate-200">{activePoint.username_olt}</span>
                        <CopyButton value={activePoint.username_olt} />
                      </div>
                    </div>
                  )}
                  {activePoint.password_olt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Password</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-700 dark:text-slate-200">
                          {showPassword ? activePoint.password_olt : "••••••••"}
                        </span>
                        <button
                          onClick={() => setShowPassword((s) => !s)}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <CopyButton value={activePoint.password_olt} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ===== POP ===== */}
          {activePoint.type === "POP" && activePoint.alamat && (
            <DetailRow icon={MapPin} label="Alamat">
              <p className="leading-relaxed">{activePoint.alamat}</p>
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
              >
                Buka di Google Maps <ExternalLink size={11} />
              </a>
            </DetailRow>
          )}

          {/* Tanggal dibuat -- sama buat semua tipe */}
          {activePoint.createdAt && (
            <DetailRow icon={Calendar} label="Terdaftar Sejak">
              <p>{formatDate(activePoint.createdAt)}</p>
            </DetailRow>
          )}
        </div>
      </div>
    </>
  );
}