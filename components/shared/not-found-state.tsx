import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFoundState({
  message = "Data yang kamu cari tidak ditemukan.",
  backHref = "/dashboard",
  backLabel = "Kembali ke Dashboard",
}: {
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <FileQuestion className="text-slate-400" size={28} />
      </div>

      <h2 className="text-lg font-bold text-slate-800">Tidak Ditemukan</h2>
      <p className="mt-2 text-sm text-slate-500">{message}</p>

      <Link
        href={backHref}
        className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        {backLabel}
      </Link>
    </div>
  );
}