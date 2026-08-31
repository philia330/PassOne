"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, QrCode} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type OntData = {
  id_ont: number;
  serial_number: string;
  pelanggan: string;
  status: string;
};

type OntQrDialogProps = {
  ont: OntData;
  children?: React.ReactNode;
};

export function OntQrDialog({ ont, children }: OntQrDialogProps) {
  const [open, setOpen] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrUrl = `${appUrl}/masterdata/ont?highlight=${ont.id_ont}`;

  const handleDownloadPng = async () => {
    const svg = qrRef.current;
    if (!svg) return;

    // Get SVG dimensions
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // High resolution (3x for print quality)
      const scale = 3;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      // Add white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-ONT-${ont.serial_number}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Label - ${ont.serial_number}</title>
          <style>
            @page { margin: 0; size: 40mm 30mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              width: 40mm;
              height: 30mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2mm;
              background: white;
            }
            .qr-wrapper {
              width: 20mm;
              height: 20mm;
            }
            .qr-wrapper svg { width: 100%; height: 100%; }
            .info {
              margin-top: 1mm;
              text-align: center;
              font-size: 7pt;
              line-height: 1.2;
            }
            .serial { font-weight: bold; font-size: 8pt; }
            .customer { color: #666; }
          </style>
        </head>
        <body>
          <div class="qr-wrapper">
            ${qrRef.current?.outerHTML || ""}
          </div>
          <div class="info">
            <div class="serial">${ont.serial_number}</div>
            <div class="customer">${ont.pelanggan || "Belum terpasang"}</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="cursor-pointer rounded-xl active:scale-90 transition-transform dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="Lihat QR Code"
          >
            <QrCode className="h-4 w-4 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300" />
          </Button>
        }
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </DialogTrigger>

      <DialogContent className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">


        <DialogHeader className="text-center">
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            QR Code ONT
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Scan QR ini dengan kamera HP untuk langsung membuka detail ONT
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="rounded-2xl border-4 border-white bg-white p-4 shadow-lg dark:border-slate-800">
            <QRCodeSVG
              ref={qrRef}
              value={qrUrl}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {ont.serial_number}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {ont.pelanggan || "Belum terpasang"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Status: {ont.status}
            </p>
          </div>

          {/* URL Preview */}
          <div className="w-full rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-all">
              {qrUrl}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer rounded-xl h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={handleDownloadPng}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              className="flex-1 cursor-pointer rounded-xl h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
