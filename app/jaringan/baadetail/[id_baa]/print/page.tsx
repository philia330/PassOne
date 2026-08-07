import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { getBaaById } from "@/app/jaringan/baa/actions";
import BaaInvoice from "../components/BaaInvoice";
import type { Prisma } from "@prisma/client";

interface PrintPageProps {
  params: Promise<{
    id_baa: string;
  }>;
}

export default async function BaaPrintPage({ params }: PrintPageProps) {
  const session = await auth();
  const allowedRoles = [Role.ADMIN, Role.LEADER, Role.TEKNISI];

  if (!session || !allowedRoles.includes(session.user?.role as Role)) {
    redirect("/dashboard");
  }

  const { id_baa } = await params;
  const id = parseInt(id_baa);

  if (isNaN(id)) {
    notFound();
  }

  const baa = await getBaaById(id);

  if (!baa) {
    notFound();
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Button - hidden when printing */}
      <div className="no-print sticky top-0 z-50 flex justify-center bg-slate-100 p-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-purple-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Cetak Invoice
        </button>
        <a
          href={`/workspace?view=baa`}
          className="ml-4 flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-300"
        >
          Kembali
        </a>
      </div>

      <div className="print:shadow-none">
        <BaaInvoice
          baa={baa as any}
          details={baa.baadetail as any}
        />
      </div>
    </>
  );
}
