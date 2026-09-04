import { BriefcaseBusiness, CalendarDays, ClipboardList, Code2, Mail, UserRound } from "lucide-react";

import ImagePreview from "@/components/shared/image-preview";
import { RoleLabel } from "@/lib/auth/roles";
import { getProfileStats } from "@/app/actions/profile-stats";

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{value || "-"}</p>
    </div>
  );
}

function StatCard({ label, value, detail, accent = "purple" }: { label: string; value: number; detail: string; accent?: "purple" | "sky" | "emerald" | "amber" }) {
  const styles = {
    purple: "from-purple-600 via-fuchsia-500 to-sky-500",
    sky: "from-sky-600 to-cyan-500",
    emerald: "from-emerald-600 to-teal-500",
    amber: "from-amber-500 to-orange-500",
  }[accent];

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${styles} p-5 text-white shadow-lg dark:shadow-none`}>
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-3 text-4xl font-bold tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-white/75">{detail}</p>
    </div>
  );
}

function ProgressBar({ open, active, total }: { open: number; active: number; total: number }) {
  const activePercent = total ? (active / total) * 100 : 0;
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center justify-between text-sm"><span className="font-medium text-slate-700 dark:text-slate-200">Konversi menjadi Aktif</span><strong className="text-emerald-600 dark:text-emerald-400">{Math.round(activePercent)}%</strong></div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${activePercent}%` }} /></div>
      <div className="mt-3 flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>{open} Open</span><span>{active} Aktif</span></div>
    </div>
  );
}

export default async function ProfilePage() {
  const data = await getProfileStats();
  if (!data) return null;

  const { user, sales, teknisi } = data;
  const roleLabel = RoleLabel[user.role];
  const joinedDate = new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const totalBaa = (teknisi?.baaUtama ?? 0) + (teknisi?.baaTambahan ?? 0);
  const initials = user.nama.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1"><p className="text-sm font-medium text-purple-600 dark:text-purple-400">Account</p><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profil Saya</h1><p className="text-sm text-slate-500 dark:text-slate-400">Informasi akun dan ringkasan pekerjaan Anda di PASSNET.</p></div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-6 py-8 text-white sm:px-8"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white/30 bg-white/20 text-3xl font-bold shadow-xl">{user.foto ? <ImagePreview src={user.foto} alt={user.nama} width={96} height={96} className="h-24 w-24 object-cover" /> : <span>{initials}</span>}</div><div><p className="text-sm font-medium text-white/75">Profil pengguna</p><h2 className="mt-1 text-2xl font-bold">{user.nama}</h2><p className="mt-1 text-sm text-white/80">{roleLabel} · @{user.username}</p></div></div></div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3"><InfoItem icon={UserRound} label="Nama lengkap" value={user.nama} /><InfoItem icon={BriefcaseBusiness} label="Role" value={roleLabel} /><InfoItem icon={Code2} label="Kode user" value={user.kode_user} /><InfoItem icon={Mail} label="Email" value={user.email ?? "Belum diatur"} /><InfoItem icon={CalendarDays} label="Tanggal bergabung" value={joinedDate} /><InfoItem icon={ClipboardList} label="Username" value={user.username} /></div>
      </section>

      {sales && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Performa Sales</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ringkasan FAB yang Anda input sebagai sales.</p></div><ClipboardList className="text-purple-500" size={24} /></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><StatCard label="Total FAB" value={sales.totalFab} detail="FAB tercatat" /><StatCard label="Open" value={sales.openFab} detail="Menunggu instalasi" accent="sky" /><StatCard label="Aktif" value={sales.aktifFab} detail="Berhasil terpasang" accent="emerald" /></div><ProgressBar open={sales.openFab} active={sales.aktifFab} total={sales.totalFab} /></section>}

      {teknisi && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Ringkasan Teknisi</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aktivitas FAB referral dan pengerjaan BAA Anda.</p></div><ClipboardList className="text-sky-500" size={24} /></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="FAB Referral" value={teknisi.referralFab} detail="Diinput oleh Anda" /><StatCard label="Total BAA" value={totalBaa} detail="Pekerjaan ditangani" accent="sky" /><StatCard label="Teknisi Utama" value={teknisi.baaUtama} detail="BAA sebagai utama" accent="emerald" /><StatCard label="Teknisi Tambahan" value={teknisi.baaTambahan} detail="BAA sebagai tambahan" accent="amber" /></div></section>}
    </div>
  );
}
