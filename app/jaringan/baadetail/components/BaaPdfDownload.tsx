"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";

import BaaPdfDocument, { type BaaPdfData } from "./BaaPdfDocument";

interface BaaPdfDownloadProps {
  baa: BaaPdfData;
  appName?: string;
}

export function BaaPdfDownload({
  baa,
  appName = "PASSNET",
}: BaaPdfDownloadProps) {
  // Generate nama file PDF yang aman
  const safeFileName = baa.fab?.nama_pelanggan
    ? baa.fab.nama_pelanggan.replace(/[^a-zA-Z0-9]/g, "_")
    : "Pelanggan";

  const fileName = `BAA-${baa.kode_baa}-${safeFileName}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <BaaPdfDocument
          baa={baa}
          appName={appName}
        />
      }
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