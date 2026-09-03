"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

const WARNING_WINDOW_MS = 60 * 1000;
const COUNTDOWN_SECONDS = 5;

export default function SessionExpiryWarning() {
  const { data: session, status, update } = useSession();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isExtending, setIsExtending] = useState(false);
  const logoutStarted = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.expires) {
      return;
    }

    const expiresAt = new Date(session.expires).getTime();
    const warningDelay = Math.max(0, expiresAt - Date.now() - WARNING_WINDOW_MS);
    const timer = window.setTimeout(() => {
      logoutStarted.current = false;
      setCountdown(COUNTDOWN_SECONDS);
      setIsWarningOpen(true);
    }, warningDelay);

    return () => window.clearTimeout(timer);
  }, [session?.expires, status]);

  useEffect(() => {
    if (!isWarningOpen) return;

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          if (!logoutStarted.current) {
            logoutStarted.current = true;
            void signOut({ callbackUrl: "/login?sessionExpired=1" });
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isWarningOpen]);

  async function handleContinueSession() {
    if (isExtending || countdown === 0) return;

    setIsExtending(true);
    try {
      const refreshedSession = await update();
      if (!refreshedSession) {
        await signOut({ callbackUrl: "/login?sessionExpired=1" });
        return;
      }

      setIsWarningOpen(false);
      setCountdown(COUNTDOWN_SECONDS);
      toast.success("Sesi Anda telah diperpanjang.");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Sesi tidak dapat diperpanjang. Silakan login kembali.");
    } finally {
      setIsExtending(false);
    }
  }

  if (!isWarningOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="session-expiry-title">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-2xl shadow-slate-950/30 dark:border-amber-500/30 dark:bg-slate-900 sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          <AlertTriangle size={30} strokeWidth={2.2} />
        </div>

        <h2 id="session-expiry-title" className="mt-5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Sesi Anda akan segera berakhir
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Untuk menjaga keamanan akun, Anda akan dikeluarkan secara otomatis. Lanjutkan sesi untuk tetap bekerja.
        </p>

        <div className="mx-auto my-7 flex h-32 w-32 items-center justify-center rounded-full border-8 border-amber-100 bg-amber-50 dark:border-amber-500/15 dark:bg-amber-500/10">
          <span className="text-6xl font-bold tabular-nums text-amber-600 dark:text-amber-400" aria-label={`${countdown} detik tersisa`}>
            {countdown}
          </span>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Detik tersisa</p>

        <button type="button" onClick={handleContinueSession} disabled={isExtending || countdown === 0} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isExtending ? <><Loader2 size={17} className="animate-spin" /> Memperpanjang sesi...</> : <><RefreshCw size={17} /> Lanjutkan Sesi</>}
        </button>
      </div>
    </div>
  );
}
