"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type QrScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil sekali per hasil scan valid. Parent yang menentukan apa
   * yang terjadi selanjutnya (navigasi, isi form, dsb). */
  onScanResult: (rawValue: string) => void;
  title?: string;
  description?: string;
};

const READER_ELEMENT_ID = "shared-qr-reader";

export function QrScannerDialog({
  open,
  onOpenChange,
  onScanResult,
  title = "Scan Kode",
  description = "Arahkan kamera ke QR code atau barcode",
}: QrScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Kunci supaya 1 kode QR yang sama tidak memicu onScanResult berkali-kali
  // selama masih ada di depan kamera (html5-qrcode scan terus-menerus per frame).
  const lockedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore stop errors
      }
    }
    setIsScanning(false);
    scannerRef.current = null;
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    lockedRef.current = false;

    try {
      const html5QrCode = new Html5Qrcode(READER_ELEMENT_ID);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        // qrbox dibuat persegi panjang (bukan bujur sangkar) supaya lebih
        // nyaman untuk barcode 1D yang bentuknya memanjang, tapi tetap
        // cukup luas untuk QR 2D.
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.5,
        // Dukung QR code (2D) DAN berbagai barcode 1D yang umum dipakai
        // stiker pabrik ONT (Code128, Code39, EAN, UPC, ITF, Codabar, dst).
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
        ],
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (lockedRef.current) return;
          lockedRef.current = true;
          onScanResult(decodedText);
        },
        () => {
          // belum ada QR terdeteksi di frame ini, abaikan
        }
      );

      setIsScanning(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("Permission") || message.includes("NotAllowedError")) {
        setError("Izin kamera ditolak. Aktifkan akses kamera di pengaturan browser.");
      } else if (message.includes("NotFoundError") || message.includes("no cameras")) {
        setError("Kamera tidak ditemukan. Pastikan device memiliki kamera.");
      } else {
        setError(`Gagal mengakses kamera: ${message}`);
      }
    }
  }, [onScanResult]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(timer);
    }
    stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setError(null);
    startScanner();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-slate-900 dark:text-slate-100">{title}</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative w-full max-w-[320px] aspect-[3/2] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div id={READER_ELEMENT_ID} className="w-full h-full" />

            {isScanning && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-white text-xs">
                <Camera className="h-3 w-3 animate-pulse" />
                <span>Scanning...</span>
              </div>
            )}

            {!isScanning && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <CameraOff className="h-12 w-12 text-slate-400" />
                <span className="text-sm text-slate-500">Kamera tidak aktif</span>
              </div>
            )}
          </div>

          {error && (
            <div className="w-full rounded-xl bg-red-50 p-4 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-red-600 dark:text-red-400 p-0 h-auto mt-2"
                    onClick={handleRetry}
                  >
                    Coba lagi
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Pastikan memberikan izin kamera saat diminta browser
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}