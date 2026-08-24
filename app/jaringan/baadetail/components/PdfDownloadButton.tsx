"use client";

// Komponen ini adalah pure client-only component
// IMPORT LANGSUNG dari @react-pdf/renderer tanpa dynamic wrapper
// karena komponen ini sudah berada di dalam boundary "use client"
// dan akan di-import dengan dynamic(ssr: false) dari komponen pemanggil

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import type { BaaPdfData } from "./BaaPdfDocument";

// Lazy load BaaPdfDocument
import dynamic from "next/dynamic";

const BaaPdfDocumentLazy = dynamic(
  () => import("./BaaPdfDocument").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </span>
    )
  }
);

interface PdfDownloadButtonProps {
  baa: BaaPdfData;
  appName?: string;
}

export default function PdfDownloadButton({ baa, appName = "PASSNET" }: PdfDownloadButtonProps) {
  // Generate filename yang aman
  const safeFileName = baa.fab?.nama_pelanggan
    ? baa.fab.nama_pelanggan.replace(/[^a-zA-Z0-9]/g, "_")
    : "Pelanggan";

  const fileName = `BAA-${baa.kode_baa}-${safeFileName}.pdf`;

  return (
    <PDFDownloadLink
      document={<BaaPdfDocumentLazy baa={baa} appName={appName} />}
      fileName={fileName}
      className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-purple-700"
    >
      {({ loading }) => (
        <span className="flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </span>
      )}
    </PDFDownloadLink>
  );
}
