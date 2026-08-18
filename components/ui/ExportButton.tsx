"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ExportButtonProps {
  apiUrl: string;
  filenamePrefix?: string;
  className?: string;
}

export function ExportButton({ apiUrl, filenamePrefix = "Export", className = "" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Gagal mengekspor data");
        return;
      }

      // Download file
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

    } catch (error) {
      console.error("Export error:", error);
      alert("Terjadi kesalahan saat mengekspor data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
      className={`rounded-xl border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 ${className}`}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Excel
    </Button>
  );
}
