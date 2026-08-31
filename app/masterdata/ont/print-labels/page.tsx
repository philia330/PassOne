"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

type Ont = {
  id_ont: number;
  serial_number: string;
  model: string;
  pelanggan: string;
  status: string;
};

export default function PrintLabelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [onts, setOnts] = useState<Ont[]>([]);
  const [loading, setLoading] = useState(true);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids) {
      router.push("/masterdata/ont");
      return;
    }

    const fetchOnts = async () => {
      try {
        const response = await fetch(`/api/ont?ids=${ids}`);
        if (!response.ok) throw new Error("Failed to fetch ONTs");
        const data = await response.json();
        setOnts(data);
      } catch (error) {
        console.error("Error fetching ONTs:", error);
        router.push("/masterdata/ont");
      } finally {
        setLoading(false);
      }
    };

    fetchOnts();
  }, [searchParams, router]);

  // Auto-print when page loads and has data
  useEffect(() => {
    if (onts.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Memuat label QR...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen-only controls (hidden when printing) */}
      <div className="no-print min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/masterdata/ont"
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Kembali
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Cetak Label QR
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {onts.length} label siap dicetak
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Printer className="h-5 w-5" />
              Cetak Sekarang
            </button>
          </div>

          {/* Preview Grid */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {onts.map((ont) => (
                <div
                  key={ont.id_ont}
                  className="aspect-[4/3] border-2 border-dashed dark:border-slate-600 rounded-xl p-2 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/30"
                >
                  <QRCodeSVG
                    value={`${appUrl}/masterdata/ont?highlight=${ont.id_ont}`}
                    size={60}
                    level="H"
                    bgColor="transparent"
                    fgColor="currentColor"
                    className="text-slate-800 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[8px] font-bold text-slate-600 dark:text-slate-300 text-center truncate w-full">
                    {ont.serial_number}
                  </p>
                  <p className="text-[6px] text-slate-400 dark:text-slate-500 text-center truncate w-full">
                    {ont.model || ont.pelanggan || "Belum terpasang"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Pastikan printer sudah terhubung dan kertas label tersedia.</p>
            <p className="mt-1">Tekan Ctrl+P atau klik tombol &quot;Cetak Sekarang&quot; untuk memulai.</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          /* Grid layout for labels */
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 3mm !important;
            padding: 0 !important;
          }

          /* Individual label */
          .qr-label {
            width: 40mm !important;
            height: 30mm !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1.5mm !important;
            border: 0.5mm solid #000 !important;
            page-break-inside: avoid !important;
            background: white !important;
          }

          .qr-label svg {
            width: 18mm !important;
            height: 18mm !important;
          }

          .qr-label .serial {
            font-size: 7pt !important;
            font-weight: bold !important;
            margin-top: 0.5mm !important;
            text-align: center !important;
            word-break: break-all !important;
          }

          .qr-label .customer {
            font-size: 6pt !important;
            color: #666 !important;
            text-align: center !important;
            margin-top: 0.3mm !important;
          }
        }
      `}</style>

      {/* Print-only content - actual labels */}
      <div className="print-grid hidden-print">
        {onts.map((ont) => (
          <div key={ont.id_ont} className="qr-label">
            <QRCodeSVG
              value={`${appUrl}/masterdata/ont?highlight=${ont.id_ont}`}
              size={120}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <div className="serial">{ont.serial_number}</div>
            <div className="customer">{ont.model || ont.pelanggan || "Belum terpasang"}</div>
          </div>
        ))}
      </div>
    </>
  );
}
