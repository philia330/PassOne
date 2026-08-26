"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QrScannerDialog } from "@/components/shared/QrScannerDialog";

type OntQrScannerProps = {
  children?: React.ReactNode;
};

export function OntQrScanner({ children }: OntQrScannerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const basePath = `${appUrl}/masterdata/ont`;

  const handleScanResult = (decodedText: string) => {
    setOpen(false);

    if (decodedText.startsWith(basePath) && decodedText.includes("highlight=")) {
      const path = decodedText.replace(appUrl, "");
      router.push(path);
    } else {
      toast.error("QR code tidak dikenali. Pastikan ini QR code ONT dari aplikasi ini.");
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="contents">
        {children}
      </div>

      <QrScannerDialog
        open={open}
        onOpenChange={setOpen}
        onScanResult={handleScanResult}
        title="Scan QR Code ONT"
        description="Arahkan kamera ke QR code yang tertera di stiker ONT"
      />
    </>
  );
}

// Export standalone scanner trigger button untuk navbar
export function QrScannerButton({ className }: { className?: string }) {
  return (
    <OntQrScanner>
      <div className={className} title="Scan QR Code ONT">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" />
          <rect width="5" height="5" x="16" y="3" rx="1" />
          <rect width="5" height="5" x="3" y="16" rx="1" />
          <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
          <path d="M21 21v.01" />
          <path d="M12 7v3a2 2 0 0 1-2 2H7" />
          <path d="M3 12h.01" />
          <path d="M12 3h.01" />
          <path d="M12 16v.01" />
          <path d="M16 12h1" />
          <path d="M21 12v.01" />
          <path d="M12 21v-1" />
        </svg>
      </div>
    </OntQrScanner>
  );
}